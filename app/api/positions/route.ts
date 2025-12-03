import { NextResponse } from 'next/server'

// Mark route as dynamic since it uses request.url
export const dynamic = 'force-dynamic'

export interface Position {
  id: string
  asset: string
  direction: 'Long' | 'Short'
  entryPrice: number
  currentPrice: number
  size: number // position size in USD
  leverage: number
  unrealizedPnl: number
  unrealizedPnlPercent: number
  entryTime: string
  liquidationPrice?: number
  exitConditions?: Array<{
    type: string
    description: string
    status: 'PENDING' | 'TRIGGERED' | 'CANCELLED'
  }>
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userAddress = searchParams.get('user')
    
    // TODO: Fetch real positions from Hyperliquid API
    // For now, return mock positions
    // In production, use: POST https://api.hyperliquid.xyz/info
    // Body: { "type": "clearinghouseState", "user": userAddress }
    
    const mockPositions: Position[] = [
      {
        id: 'POS-001',
        asset: 'ETH',
        direction: 'Long',
        entryPrice: 3125.50,
        currentPrice: 3245.67,
        size: 125000,
        leverage: 3,
        unrealizedPnl: 15012.50,
        unrealizedPnlPercent: 12.0,
        entryTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        liquidationPrice: 2500.00,
        exitConditions: []
      },
      {
        id: 'POS-002',
        asset: 'BTC',
        direction: 'Long',
        entryPrice: 65200.00,
        currentPrice: 67850.42,
        size: 250000,
        leverage: 2,
        unrealizedPnl: 10125.00,
        unrealizedPnlPercent: 4.05,
        entryTime: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
        liquidationPrice: 50000.00,
        exitConditions: []
      },
      {
        id: 'POS-003',
        asset: 'SOL',
        direction: 'Short',
        entryPrice: 148.20,
        currentPrice: 142.89,
        size: 75000,
        leverage: 4,
        unrealizedPnl: 1987.50,
        unrealizedPnlPercent: 2.65,
        entryTime: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
        liquidationPrice: 160.00,
        exitConditions: []
      }
    ]
    
    // If user address provided, try to fetch real positions
    if (userAddress) {
      try {
        const response = await fetch('https://api.hyperliquid.xyz/info', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            type: 'clearinghouseState',
            user: userAddress
          }),
          signal: AbortSignal.timeout(5000)
        })
        
        if (response.ok) {
          const data = await response.json()
          // Transform Hyperliquid position data to our format
          // TODO: Parse actual response structure
          console.log('Fetched positions from Hyperliquid:', data)
          // For now, return mock data until we parse the actual response
        }
      } catch (error) {
        console.log('Could not fetch positions from Hyperliquid, using mock data:', error)
      }
    }
    
    return NextResponse.json(mockPositions)
  } catch (error) {
    console.error('Error fetching positions:', error)
    return NextResponse.json([])
  }
}

