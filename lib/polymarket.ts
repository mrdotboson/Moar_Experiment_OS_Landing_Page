// Polymarket API integration for fetching live markets

export interface PolymarketMarket {
  id: string
  question: string
  slug: string
  conditionId: string
  endDate: string
  resolutionSource: string
  active: boolean
  liquidity: number
  volume: number
  currentProbability?: number
  category?: string
  rules?: string // Market resolution rules/criteria
  description?: string // Additional market description
}

// Fetch markets from Polymarket API via Next.js API route
export async function fetchPolymarketMarkets(searchQuery?: string, category?: string): Promise<PolymarketMarket[]> {
  try {
    // Use Next.js API route to avoid CORS issues
    const params = new URLSearchParams()
    if (searchQuery && searchQuery.trim()) {
      params.append('search', searchQuery.trim())
    }
    if (category) {
      params.append('category', category)
    }
    
    const url = params.toString() 
      ? `/api/polymarket?${params.toString()}`
      : '/api/polymarket'
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-store' // Always fetch fresh data
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()
    return data as PolymarketMarket[]
  } catch (error) {
    console.error('Error fetching Polymarket markets:', error)
    // Return mock data as fallback for demo purposes
    return getMockMarkets()
  }
}

// Mock markets for demo/fallback
function getMockMarkets(): PolymarketMarket[] {
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
      category: 'crypto'
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
      category: 'crypto'
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
    }
  ]
}

// Format market for display in terminal
export function formatMarketForInput(market: PolymarketMarket, probability: number = 70): string {
  return `Polymarket "${market.question}" probability ≥ ${probability}%`
}

