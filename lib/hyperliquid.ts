// Hyperliquid API integration for fetching live market prices

export interface HyperliquidMarket {
  symbol: string
  price: number
  volume24h: number
  change24h: number // percentage change
  volume24hUsd: number
}

// Fetch markets from Hyperliquid API
export async function fetchHyperliquidMarkets(): Promise<HyperliquidMarket[]> {
  try {
    // Hyperliquid API endpoint for market data
    const response = await fetch('/api/hyperliquid', {
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
    return data as HyperliquidMarket[]
  } catch (error) {
    console.error('Error fetching Hyperliquid markets:', error)
    // Return mock data as fallback for demo purposes
    return getMockMarkets()
  }
}

// Mock markets for demo/fallback - includes crypto and non-crypto markets available on Hyperliquid
function getMockMarkets(): HyperliquidMarket[] {
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

