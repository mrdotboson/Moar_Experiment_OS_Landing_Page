import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const searchQuery = searchParams.get('search') || ''
  const isSearching = searchQuery.trim().length > 0
  try {
    // Try multiple Polymarket API endpoints with pagination/limit support
    // Polymarket uses GraphQL API and CLOB API for market data
    const endpoints = [
      // Try GraphQL API first (most reliable)
      {
        url: 'https://data-api.polymarket.com/events',
        type: 'graphql',
        params: { limit: 10000, active: true }
      },
      // CLOB API endpoints
      {
        url: 'https://clob.polymarket.com/markets',
        type: 'rest',
        params: { limit: 10000 }
      },
      {
        url: 'https://api.polymarket.com/markets',
        type: 'rest',
        params: { limit: 10000 }
      },
      // Fallback endpoints without limit
      {
        url: 'https://clob.polymarket.com/markets',
        type: 'rest',
        params: {}
      },
      {
        url: 'https://api.polymarket.com/markets',
        type: 'rest',
        params: {}
      }
    ]

    let data: any = null
    let lastError: Error | null = null
    let allMarkets: any[] = []

    // Try each endpoint until one works, and handle pagination if available
    for (const endpointConfig of endpoints) {
      try {
        const { url, type, params } = endpointConfig
        let requestUrl = url
        
        // Build query string for REST endpoints
        if (type === 'rest' && Object.keys(params).length > 0) {
          const queryParams = new URLSearchParams()
          Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              queryParams.append(key, String(value))
            }
          })
          requestUrl = `${url}?${queryParams.toString()}`
        }
        
        const response = await fetch(requestUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Sentient Terminal/1.0',
          },
          signal: AbortSignal.timeout(15000) // 15 second timeout for large requests
        })

        if (response.ok) {
          const responseData = await response.json()
          allMarkets = Array.isArray(responseData) ? responseData : (responseData.data || responseData.markets || [])
          
          // If we got a large number of results, assume we got all (or most) markets
          // Otherwise, try pagination to get more
          if (allMarkets.length >= 1000) {
            // Got a good chunk, likely all or most markets
            data = allMarkets
            break
          } else if (allMarkets.length > 0 && allMarkets.length < 100) {
            // Got a small number, try pagination to get more
            let hasMore = true
            let page = 2
            const pageSize = 1000
            
            while (hasMore && page <= 20) { // Max 20 pages (20,000 markets)
              // Build paginated URL
              const paginationParams = new URLSearchParams()
              paginationParams.append('offset', String((page - 1) * pageSize))
              paginationParams.append('limit', String(pageSize))
              const paginatedUrl = `${url}?${paginationParams.toString()}`
              
              try {
                const pageResponse = await fetch(paginatedUrl, {
                  method: 'GET',
                  headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'Sentient Terminal/1.0',
                  },
                  signal: AbortSignal.timeout(10000)
                })
                
                if (pageResponse.ok) {
                  const pageData = await pageResponse.json()
                  const pageMarkets = Array.isArray(pageData) ? pageData : (pageData.data || pageData.markets || [])
                  
                  if (pageMarkets.length > 0) {
                    allMarkets.push(...pageMarkets)
                    if (pageMarkets.length < pageSize) {
                      hasMore = false
                    } else {
                      page++
                    }
                  } else {
                    hasMore = false
                  }
                } else {
                  hasMore = false
                }
              } catch {
                hasMore = false
              }
            }
            
            data = allMarkets
            break
          } else {
            // Got some results, use them
            data = allMarkets
            break
          }
        } else {
          // Response not OK, try next endpoint
          continue
        }
      } catch (error) {
        lastError = error as Error
        continue // Try next endpoint
      }
    }

    // If all endpoints failed, return mock data
    if (!data || data.length === 0) {
      console.log('All Polymarket API endpoints failed or returned no data, using mock data:', lastError?.message)
      return NextResponse.json(getMockMarkets())
    }
    
    // Log successful fetch for debugging
    console.log(`Successfully fetched ${data.length} markets from Polymarket API`)
    
    // Transform and filter markets
    const markets = (Array.isArray(data) ? data : []).map((market: any) => {
      // Calculate probability from token prices if available
      let probability = 0
      if (market.tokens && Array.isArray(market.tokens) && market.tokens.length > 0) {
        // Find the YES token or first outcome token
        const yesToken = market.tokens.find((t: any) => 
          t.outcome?.toLowerCase().includes('yes') || 
          t.outcome?.toLowerCase() === 'yes' ||
          t.price !== undefined
        )
        if (yesToken && yesToken.price !== undefined) {
          probability = yesToken.price * 100
        } else if (market.tokens[0]?.price !== undefined) {
          probability = market.tokens[0].price * 100
        }
      }
      
      // Calculate liquidity - try multiple fields
      const liquidity = market.liquidity || 
                       market.totalLiquidity || 
                       market.total_liquidity || 
                       market.liquidityUsd || 
                       market.usdLiquidity ||
                       (market.tokens?.reduce((sum: number, token: any) => sum + (token.liquidity || 0), 0) || 0)
      
      // Determine if market is resolved/closed
      // A market is unresolved if:
      // - It's not closed
      // - It's not archived  
      // - It's accepting orders (or at least not explicitly rejecting orders)
      // - No winner has been determined in tokens
      const isClosed = market.closed === true
      const isArchived = market.archived === true
      const isNotAcceptingOrders = market.accepting_orders === false
      
      // Check if market has been resolved (winner determined)
      const hasWinner = market.tokens && market.tokens.some((t: any) => t.winner === true)
      
      // Market is active/unresolved if it's not closed, not archived, and accepting orders
      const isActive = !isClosed && !isArchived && !isNotAcceptingOrders && !hasWinner
      
      return {
        id: market.id || market.condition_id || market.conditionId || market.market_slug || market.slug || market.marketId || '',
      question: market.question || market.title || market.name || market.description || '',
        slug: market.market_slug || market.slug || market.id || '',
        conditionId: market.condition_id || market.conditionId || market.id || '',
        endDate: market.end_date_iso || market.endDate || market.endDateISO || market.end_date || market.endDate || '',
        resolutionSource: market.resolutionSource || market.resolution_source || market.resolutionSource || '',
        active: isActive,
        liquidity: liquidity,
        volume: market.volume || market.volume24h || market.volume_24h || market.volumeUsd || market.usdVolume || 0,
        currentProbability: probability || market.probability || market.currentProbability || market.current_probability || 0,
        category: market.category || market.tags?.[0] || market.tags?.[1] || market.groupItemTitle || market.group_item_title || '',
        rules: market.rules || market.resolutionCriteria || market.resolution_criteria || market.details || market.rule || market.description || '',
        description: market.description || market.desc || market.longDescription || market.long_description || ''
      }
    })

    // Filter markets based on whether we're searching or not
    // For searches, be more lenient with filters to show more results
    const minLiquidity = isSearching ? 0 : 10000 // No liquidity filter when searching
    
    // Only show markets that haven't resolved yet (unresolved markets)
    let filteredMarkets = markets.filter(m => {
      const passesActiveFilter = m.active // Only show unresolved/active markets
      const passesLiquidityFilter = m.liquidity >= minLiquidity
      
      return passesActiveFilter && passesLiquidityFilter
    })
    
    // Get category filter from query params
    const categoryFilter = searchParams.get('category') || ''
    
    if (!isSearching && !categoryFilter) {
      // Default: Show top markets by liquidity (no category filter, but limit to top 100 for performance)
      filteredMarkets = filteredMarkets
      .sort((a, b) => (b.liquidity || 0) - (a.liquidity || 0))
        .slice(0, 100) // Top 100 markets by liquidity for default view
    } else {
      // When searching or filtering by category: Include ALL markets
      if (isSearching) {
        const query = searchQuery.toLowerCase().trim()
        const queryWords = query.split(/\s+/).filter(w => w.length > 0)
        
        filteredMarkets = filteredMarkets.filter(m => {
          // Search in multiple fields
          const question = (m.question || '').toLowerCase()
          const description = (m.description || '').toLowerCase()
          const rules = (m.rules || '').toLowerCase()
          const category = (m.category || '').toLowerCase()
          const slug = (m.slug || '').toLowerCase()
          
          // Also check for common abbreviations and related terms
          const searchableText = `${question} ${description} ${rules} ${category} ${slug}`.toLowerCase()
          
          // If query is a single word, check if it appears anywhere
          // If query has multiple words, check if all words appear (AND logic)
          if (queryWords.length === 1) {
            return searchableText.includes(queryWords[0])
          } else {
            // All words must be present
            return queryWords.every(word => searchableText.includes(word))
          }
        })
      }
      
      // Apply category filter if specified
      if (categoryFilter) {
        filteredMarkets = filteredMarkets.filter(m => {
          const marketCategory = (m.category || '').toLowerCase()
          return marketCategory.includes(categoryFilter.toLowerCase())
        })
      }
      
      // Sort by: active markets first, then by end date (most recent first), then by liquidity
      filteredMarkets = filteredMarkets.sort((a, b) => {
        // Active markets first
        if (a.active !== b.active) {
          return a.active ? -1 : 1
        }
        
        // Then by end date (future dates first, then most recent past dates)
        if (a.endDate && b.endDate) {
          try {
            const dateA = new Date(a.endDate)
            const dateB = new Date(b.endDate)
            const now = new Date()
            
            // Future dates come first
            const aIsFuture = dateA > now
            const bIsFuture = dateB > now
            
            if (aIsFuture !== bIsFuture) {
              return aIsFuture ? -1 : 1
            }
            
            // Both future or both past: most recent first
            return dateB.getTime() - dateA.getTime()
          } catch (e) {
            // If date parsing fails, continue to liquidity sort
          }
        }
        
        // Finally by liquidity
        return (b.liquidity || 0) - (a.liquidity || 0)
      })
        // No limit - return all matching markets
    }

    // If no markets found after filtering, return empty array (don't return mock data for searches)
    // This allows the UI to show "no results" instead of misleading mock data
    if (filteredMarkets.length === 0) {
      if (isSearching) {
        console.log(`No markets found matching search query: "${searchQuery}"`)
        return NextResponse.json([])
      } else {
        // Only return mock data if not searching (for initial load fallback)
        console.log('No markets found, using mock data as fallback')
      return NextResponse.json(getMockMarkets())
      }
    }

    console.log(`Returning ${filteredMarkets.length} filtered markets${isSearching ? ` for search: "${searchQuery}"` : ''}`)
    return NextResponse.json(filteredMarkets)
  } catch (error) {
    console.error('Polymarket API error:', error)
    // Return mock data as fallback
    return NextResponse.json(getMockMarkets())
  }
}

// Mock markets for demo/fallback
function getMockMarkets() {
  return [
    {
      id: 'eth-etf-approval',
      question: 'Will the SEC approve an Ethereum ETF by end of 2024?',
      slug: 'ethereum-etf-approval-2024',
      conditionId: '0x123',
      endDate: '2024-12-31T23:59:59Z',
      resolutionSource: 'SEC',
      active: true,
      liquidity: 2500000,
      volume: 1200000,
      currentProbability: 68.5,
      category: 'crypto',
      rules: 'This market will resolve to YES if the SEC approves a spot Ethereum ETF (not futures) by December 31, 2024, 11:59 PM ET. Approval must be publicly announced by the SEC. If multiple ETFs are approved, the market resolves to YES on the first approval. If no approval is announced by the deadline, the market resolves to NO.',
      description: 'Resolution based on official SEC announcements and filings.'
    },
    {
      id: 'btc-100k',
      question: 'Will Bitcoin reach $100,000 by end of 2024?',
      slug: 'bitcoin-100k-2024',
      conditionId: '0x456',
      endDate: '2024-12-31T23:59:59Z',
      resolutionSource: 'Market',
      active: true,
      liquidity: 1800000,
      volume: 950000,
      currentProbability: 72.3,
      category: 'crypto',
      rules: 'This market will resolve to YES if Bitcoin (BTC) reaches or exceeds $100,000 USD on any major exchange (Coinbase, Binance, Kraken, or Bitstamp) by December 31, 2024, 11:59 PM ET. Price is determined by the closing price on the exchange with the highest 24h volume. If Bitcoin reaches $100,000 at any point before the deadline, the market resolves to YES immediately.',
      description: 'Price resolution based on spot prices from major exchanges.'
    },
    {
      id: 'fed-rate-cut',
      question: 'Will the Fed cut rates by at least 0.5% in 2024?',
      slug: 'fed-rate-cut-2024',
      conditionId: '0x789',
      endDate: '2024-12-31T23:59:59Z',
      resolutionSource: 'Fed',
      active: true,
      liquidity: 1500000,
      volume: 800000,
      currentProbability: 65.2,
      category: 'finance'
    },
    {
      id: 'sec-crypto-regulation',
      question: 'Will the SEC approve comprehensive crypto regulation in 2024?',
      slug: 'sec-crypto-regulation-2024',
      conditionId: '0xabc',
      endDate: '2024-12-31T23:59:59Z',
      resolutionSource: 'SEC',
      active: true,
      liquidity: 1200000,
      volume: 600000,
      currentProbability: 58.7,
      category: 'regulation'
    },
    {
      id: 'solana-upgrade',
      question: 'Will Solana complete its major network upgrade by Q2 2024?',
      slug: 'solana-upgrade-q2-2024',
      conditionId: '0xdef',
      endDate: '2024-06-30T23:59:59Z',
      resolutionSource: 'Solana Foundation',
      active: true,
      liquidity: 850000,
      volume: 450000,
      currentProbability: 75.4,
      category: 'crypto'
    },
    {
      id: 'btc-legal-tender',
      question: 'Will Bitcoin become legal tender in another country in 2024?',
      slug: 'bitcoin-legal-tender-2024',
      conditionId: '0x111',
      endDate: '2024-12-31T23:59:59Z',
      resolutionSource: 'Government',
      active: true,
      liquidity: 950000,
      volume: 500000,
      currentProbability: 42.1,
      category: 'crypto'
    },
    {
      id: 'eth-price-4k',
      question: 'Will Ethereum reach $4,000 by end of 2024?',
      slug: 'ethereum-4000-2024',
      conditionId: '0x222',
      endDate: '2024-12-31T23:59:59Z',
      resolutionSource: 'Market',
      active: true,
      liquidity: 1100000,
      volume: 550000,
      currentProbability: 55.8,
      category: 'crypto'
    },
    {
      id: 'crypto-bank-adoption',
      question: 'Will a major US bank offer crypto trading to retail customers in 2024?',
      slug: 'crypto-bank-adoption-2024',
      conditionId: '0x333',
      endDate: '2024-12-31T23:59:59Z',
      resolutionSource: 'Bank Announcement',
      active: true,
      liquidity: 750000,
      volume: 400000,
      currentProbability: 48.3,
      category: 'finance'
    },
    {
      id: 'btc-halving-price',
      question: 'Will Bitcoin price exceed $80,000 within 6 months of the halving?',
      slug: 'bitcoin-halving-price-2024',
      conditionId: '0x444',
      endDate: '2024-10-31T23:59:59Z',
      resolutionSource: 'Market',
      active: true,
      liquidity: 1300000,
      volume: 650000,
      currentProbability: 61.5,
      category: 'crypto'
    },
    {
      id: 'eth-layer2-adoption',
      question: 'Will Ethereum Layer 2 TVL exceed $50B by end of 2024?',
      slug: 'ethereum-layer2-tvl-2024',
      conditionId: '0x555',
      endDate: '2024-12-31T23:59:59Z',
      resolutionSource: 'L2Beat',
      active: true,
      liquidity: 900000,
      volume: 480000,
      currentProbability: 67.2,
      category: 'crypto'
    }
  ]
}

