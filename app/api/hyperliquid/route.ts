import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Hyperliquid API endpoint
    const endpoints = [
      'https://api.hyperliquid.xyz/info',
      'https://api.hyperliquid.exchange/info',
    ]

    let data: any = null
    let lastError: Error | null = null

    // Try each endpoint until one works
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'Sentient Terminal/1.0',
          },
          body: JSON.stringify({
            type: 'metaAndAssetCtxs',
          }),
          signal: AbortSignal.timeout(5000) // 5 second timeout
        })

        if (response.ok) {
          const responseData = await response.json()
          // Hyperliquid returns metaAndAssetCtxs as a list: [metadata, assetContexts]
          // metadata contains universe, assetContexts contains market data
          if (Array.isArray(responseData) && responseData.length >= 1) {
            // First element contains universe and metadata
            data = responseData[0]
            // Second element contains assetContexts array
            if (responseData.length >= 2 && Array.isArray(responseData[1])) {
              data.assetContexts = responseData[1]
            }
          } else if (responseData && typeof responseData === 'object') {
            data = responseData
          }
          break // Success, exit loop
        }
      } catch (error) {
        lastError = error as Error
        continue // Try next endpoint
      }
    }

    // If all endpoints failed, return mock data
    if (!data) {
      console.log('All Hyperliquid API endpoints failed, using mock data:', lastError?.message)
      return NextResponse.json(getMockMarkets())
    }

    // Transform Hyperliquid data to our format
    // Hyperliquid returns metaAndAssetCtxs as [metadata, assetContexts]
    // metadata contains universe array with all perpetual markets
    try {
      const markets: any[] = []
      
      // Extract universe and assetContexts
      const universe = data.universe || []
      const assetContexts = data.assetContexts || []
      
      // Get price data from allMids endpoint
      // allMids returns prices as a dictionary with symbol names as keys
      let priceDict: Record<string, number> = {}
      try {
        const priceResponse = await fetch('https://api.hyperliquid.xyz/info', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({ type: 'allMids' }),
          signal: AbortSignal.timeout(5000)
        })
        
        if (priceResponse.ok) {
          const priceResult = await priceResponse.json()
          // allMids returns as object/dictionary with symbol names as keys
          if (priceResult && typeof priceResult === 'object' && !Array.isArray(priceResult)) {
            // Convert all values to numbers
            Object.keys(priceResult).forEach(symbol => {
              const price = parseFloat(String(priceResult[symbol]))
              if (!isNaN(price)) {
                priceDict[symbol] = price
              }
            })
          }
        }
      } catch (priceError) {
        console.log('Could not fetch price data, using asset contexts:', priceError)
      }
      
      // Get 24h volume data
      let volumeData: Record<string, any> = {}
      try {
        const volumeResponse = await fetch('https://api.hyperliquid.xyz/info', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({ type: 'volume24h' }),
          signal: AbortSignal.timeout(5000)
        })
        
        if (volumeResponse.ok) {
          const volumeResult = await volumeResponse.json()
          if (Array.isArray(volumeResult)) {
            volumeResult.forEach((item: any) => {
              if (item.coin) {
                volumeData[item.coin] = item
              }
            })
          }
        }
      } catch (volumeError) {
        console.log('Could not fetch volume data:', volumeError)
      }
      
      // Process ALL perpetual markets from universe
      if (Array.isArray(universe)) {
        universe.forEach((asset: any, index: number) => {
          // Skip delisted assets
          if (asset.isDelisted) {
            return
          }
          
          if (asset && asset.name) {
            const symbol = asset.name
            const assetCtx = assetContexts[index]
            
            // Get price from allMids dict (by symbol) or markPx from asset context
            // markPx is the most accurate current price
            const priceFromDict = priceDict[symbol] || null
            const markPx = assetCtx?.markPx ? parseFloat(String(assetCtx.markPx)) : null
            const price = priceFromDict || markPx || 0
            
            const volumeInfo = volumeData[symbol] || {}
            // dayNtlVlm is the 24h notional volume in USD
            const volume24hUsd = volumeInfo.volume || (assetCtx?.dayNtlVlm ? parseFloat(String(assetCtx.dayNtlVlm)) : 0)
            
            // Calculate 24h change from prevDayPx and markPx
            let change24h = 0
            if (assetCtx?.prevDayPx && assetCtx?.markPx) {
              const prevPrice = parseFloat(String(assetCtx.prevDayPx))
              const currentPrice = parseFloat(String(assetCtx.markPx))
              if (prevPrice > 0) {
                change24h = ((currentPrice - prevPrice) / prevPrice) * 100
              }
            }
            
            markets.push({
              symbol: symbol,
              price: price,
              volume24h: volume24hUsd,
              change24h: change24h,
              volume24hUsd: volume24hUsd,
            })
          }
        })
      }

      // Try to fetch hip3 markets (equities/stocks like NVDA, TSLA, PLTR, etc.)
      // Note: hip3 markets may require a different API endpoint or authentication
      let hip3Markets: any[] = []
      try {
        // Attempt to fetch hip3 markets - this may need to be updated with the correct endpoint
        // Common hip3 market symbols: NVDA, TSLA, PLTR, SPACEX, XYZ100, AAPL, MSFT, etc.
        const hip3Symbols = ['NVDA', 'TSLA', 'PLTR', 'SPACEX', 'XYZ100', 'AAPL', 'MSFT', 
                            'GOOGL', 'AMZN', 'META', 'NFLX']
        
        // For now, we'll check if any of these symbols exist in the standard universe
        // In the future, this should fetch from a dedicated hip3 endpoint
        const existingHip3Markets = markets.filter(m => 
          hip3Symbols.includes(m.symbol.toUpperCase())
        )
        
        if (existingHip3Markets.length > 0) {
          hip3Markets = existingHip3Markets
          console.log(`Found ${hip3Markets.length} hip3 markets in standard universe`)
        } else {
          // If hip3 markets aren't in standard universe, they may need a separate API call
          // TODO: Integrate with hip3-specific API endpoint when available
          console.log('Hip3 markets not found in standard universe - may require separate API')
        }
      } catch (hip3Error) {
        console.log('Could not fetch hip3 markets:', hip3Error)
      }

      // Combine standard markets with hip3 markets (avoid duplicates)
      const allMarkets = [...markets]
      hip3Markets.forEach(hip3Market => {
        const exists = allMarkets.some(m => m.symbol.toUpperCase() === hip3Market.symbol.toUpperCase())
        if (!exists) {
          allMarkets.push(hip3Market)
        }
      })

      // Sort by volume (highest to lowest) - return ALL markets (excluding delisted)
      const sortedMarkets = allMarkets
        .filter(m => m.price > 0) // Only include markets with valid prices
        .sort((a, b) => (b.volume24hUsd || 0) - (a.volume24hUsd || 0))

      if (sortedMarkets.length === 0) {
        console.log('No valid markets found, using mock data')
        return NextResponse.json(getMockMarkets())
      }

      console.log(`Successfully fetched ${sortedMarkets.length} markets from Hyperliquid (${hip3Markets.length} hip3 markets)`)
      return NextResponse.json(sortedMarkets)
    } catch (transformError) {
      console.error('Error transforming Hyperliquid data:', transformError)
      return NextResponse.json(getMockMarkets())
    }
  } catch (error) {
    console.error('Hyperliquid API error:', error)
    // Return mock data as fallback
    return NextResponse.json(getMockMarkets())
  }
}

// Mock markets for demo/fallback - includes crypto and non-crypto markets available on Hyperliquid
function getMockMarkets() {
  return [
    // Crypto markets
    { symbol: 'BTC', price: 67850.42, volume24h: 1250000000, change24h: 2.34, volume24hUsd: 1250000000 },
    { symbol: 'ETH', price: 3245.67, volume24h: 850000000, change24h: -1.23, volume24hUsd: 850000000 },
    { symbol: 'SOL', price: 142.89, volume24h: 320000000, change24h: 4.56, volume24hUsd: 320000000 },
    { symbol: 'AVAX', price: 38.24, volume24h: 95000000, change24h: 1.89, volume24hUsd: 95000000 },
    { symbol: 'ARB', price: 1.12, volume24h: 45000000, change24h: -0.45, volume24hUsd: 45000000 },
    { symbol: 'OP', price: 2.87, volume24h: 38000000, change24h: 3.12, volume24hUsd: 38000000 },
    { symbol: 'MATIC', price: 0.89, volume24h: 32000000, change24h: -2.34, volume24hUsd: 32000000 },
    { symbol: 'SUI', price: 1.45, volume24h: 28000000, change24h: 5.67, volume24hUsd: 28000000 },
    { symbol: 'APT', price: 8.92, volume24h: 22000000, change24h: 1.23, volume24hUsd: 22000000 },
    { symbol: 'INJ', price: 24.56, volume24h: 18000000, change24h: -3.45, volume24hUsd: 18000000 },
    // Non-crypto markets (synthetic/traditional assets on Hyperliquid)
    { symbol: 'SPX', price: 5420.15, volume24h: 280000000, change24h: 0.87, volume24hUsd: 280000000 },
    { symbol: 'NAS100', price: 19542.30, volume24h: 195000000, change24h: -0.52, volume24hUsd: 195000000 },
    { symbol: 'XAU', price: 2654.80, volume24h: 125000000, change24h: 1.23, volume24hUsd: 125000000 },
    { symbol: 'EURUSD', price: 1.0825, volume24h: 98000000, change24h: 0.34, volume24hUsd: 98000000 },
    { symbol: 'GBPUSD', price: 1.2689, volume24h: 75000000, change24h: -0.21, volume24hUsd: 75000000 },
    { symbol: 'XAG', price: 29.45, volume24h: 65000000, change24h: 2.15, volume24hUsd: 65000000 },
    { symbol: 'OIL', price: 78.92, volume24h: 55000000, change24h: -1.45, volume24hUsd: 55000000 },
    { symbol: 'TSLA', price: 248.67, volume24h: 42000000, change24h: 3.21, volume24hUsd: 42000000 },
    { symbol: 'AAPL', price: 218.45, volume24h: 38000000, change24h: -0.78, volume24hUsd: 38000000 },
    { symbol: 'NVDA', price: 142.89, volume24h: 35000000, change24h: 4.56, volume24hUsd: 35000000 },
  ]
}

