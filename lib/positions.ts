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
  priceChange?: 'up' | 'down' // For animation
  exitConditions?: Array<{
    type: string
    description: string
    status: 'PENDING' | 'TRIGGERED' | 'CANCELLED'
  }>
}

export async function fetchPositions(userAddress?: string): Promise<Position[]> {
  try {
    const params = userAddress ? `?user=${encodeURIComponent(userAddress)}` : ''
    const response = await fetch(`/api/positions${params}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-store'
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()
    return data as Position[]
  } catch (error) {
    console.error('Error fetching positions:', error)
    return []
  }
}

