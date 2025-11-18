export interface ParsedStrategy {
  asset: string
  action: 'LONG' | 'SHORT'
  conditions: {
    type: string
    description: string
    value?: string | number
    eventType?: 'polymarket' | 'price' | 'funding' | 'oi' | 'volume' | 'trend'
    marketId?: string
    probability?: number
    timePeriod?: string // For OI: '1h', '24h', '7d'
    isAbsolute?: boolean // For OI: true if absolute level, false if percentage change
  }[]
  leverage?: number
  stopLoss?: number
  takeProfit?: number
  name: string
  naturalLanguage: string
  warnings?: string[]
  // Position management fields
  isPositionManagement?: boolean // true if this is managing an existing position
  positionAction?: 'CLOSE' | 'REVERSE' | 'CANCEL' // Action to take on position
  positionId?: string // ID of position to manage
  // Advanced position management (Polymarket-specific)
  positionSize?: number // Percentage of position to close (0-100), default 100
  exitLogic?: 'ALL' | 'ANY' // Logic for multiple exit conditions (default: ALL)
  // Polymarket-specific exit conditions
  probabilityMomentum?: number // Probability momentum threshold
  probabilityMomentumDirection?: 'DROP' | 'ACCELERATE' | 'REVERSE' // Direction of momentum change
  resolutionDeadline?: number // Hours until event resolution
  resolutionDeadlineCondition?: 'BEFORE_THRESHOLD' | 'TIME_REMAINING' // Type of deadline condition
  liquidityThreshold?: number // Market liquidity threshold in USD
  probabilityChangeRate?: number // Probability change rate threshold (%/h)
  probabilityChangeRateDirection?: 'SLOW' | 'EXCEED' // Direction of change rate
  probabilityRangeMin?: number // Minimum probability threshold
  probabilityRangeMax?: number // Maximum probability threshold
  // P&L-based exits
  pnlThreshold?: number // P&L threshold (percentage or absolute)
  pnlType?: 'PERCENTAGE' | 'ABSOLUTE' // Type of P&L threshold
  // Time-based exits
  timeLimit?: number // Time limit value
  timeUnit?: 'h' | 'd' // Time unit (hours or days)
  // Trailing stop
  trailingStop?: number // Trailing stop percentage
  // Multi-event strategy support
  eventLogic?: 'AND' | 'OR' // Logic for combining multiple Polymarket events (default: AND)
  // Dynamic position sizing - explicit adjustments
  positionAdjustments?: {
    probability: number // Probability threshold
    adjustment: number // Percentage to adjust position (positive = increase, negative = decrease)
    direction: 'INCREASE' | 'DECREASE' // Direction of adjustment
  }[]
}

export interface ParseResult {
  success: boolean
  strategy?: ParsedStrategy
  error?: string
  suggestions?: string[]
}

export function parseStrategy(input: string): ParsedStrategy {
  const lowerInput = input.toLowerCase()
  const originalInput = input.trim()
  
  // Check if this is position management (close/reverse/cancel)
  const isClose = /\b(close|exit|liquidate)\b/i.test(input)
  const isReverse = /\b(reverse|flip|invert)\b/i.test(input)
  const isCancel = /\b(cancel|abort|stop)\b/i.test(input)
  const isPositionManagement = isClose || isReverse || isCancel
  
  let positionAction: 'CLOSE' | 'REVERSE' | 'CANCEL' | undefined
  if (isClose) positionAction = 'CLOSE'
  else if (isReverse) positionAction = 'REVERSE'
  else if (isCancel) positionAction = 'CANCEL'
  
  // Extract position ID (e.g., "position POS-001", "position 123", "position #001")
  let positionId: string | undefined
  const positionIdMatch = input.match(/\bposition\s+([A-Z0-9#-]+)(?:\s|$)/i)
  if (positionIdMatch) {
    positionId = positionIdMatch[1].toUpperCase()
    // Remove common prefixes if present
    if (positionId.startsWith('POS-')) {
      positionId = positionId
    } else if (positionId.startsWith('#')) {
      positionId = positionId.substring(1)
    }
  }
  
  // Extract partial position size (e.g., "Close 50% of position")
  let positionSize = 100 // Default: close 100% of position
  const partialMatch = input.match(/\b(close|reduce|scale out)\s+(\d+)%\s+(?:of\s+)?position/i) ||
                       input.match(/\b(\d+)%\s+(?:of\s+)?position/i)
  if (partialMatch) {
    positionSize = parseFloat(partialMatch[2] || partialMatch[1])
    if (positionSize > 100) positionSize = 100
    if (positionSize < 0) positionSize = 0
  }
  
  // Extract P&L-based exit conditions
  let pnlThreshold: number | undefined
  let pnlType: 'PERCENTAGE' | 'ABSOLUTE' | undefined
  const pnlPercentMatch = input.match(/\b(?:p&l|pnl|profit|unrealized\s+p&l|unrealized\s+pnl)\s+(?:reaches|hits|exceeds|>=|>)\s+([+-]?\d+(?:\.\d+)?)%/i)
  const pnlAbsoluteMatch = input.match(/\b(?:p&l|pnl|profit|unrealized\s+p&l|unrealized\s+pnl)\s+(?:reaches|hits|exceeds|>=|>)\s+\$?([+-]?\d+(?:,\d+)*(?:\.\d+)?)\s*(K|M|B)?/i)
  const pnlDropsMatch = input.match(/\b(?:p&l|pnl|profit|unrealized\s+p&l|unrealized\s+pnl)\s+(?:drops?\s+to|falls?\s+to|<=|drops?\s+below)\s+([+-]?\d+(?:\.\d+)?)%/i)
  
  if (pnlPercentMatch) {
    pnlThreshold = parseFloat(pnlPercentMatch[1])
    pnlType = 'PERCENTAGE'
  } else if (pnlAbsoluteMatch) {
    let value = parseFloat(pnlAbsoluteMatch[1].replace(/,/g, ''))
    const unit = pnlAbsoluteMatch[2]?.toUpperCase() || ''
    if (unit === 'K') value *= 1000
    else if (unit === 'M') value *= 1000000
    else if (unit === 'B') value *= 1000000000
    pnlThreshold = value
    pnlType = 'ABSOLUTE'
  } else if (pnlDropsMatch) {
    pnlThreshold = parseFloat(pnlDropsMatch[1])
    pnlType = 'PERCENTAGE'
  }
  
  // Extract time-based exit conditions
  let timeLimit: number | undefined
  let timeUnit: 'h' | 'd' | undefined
  const timeAfterMatch = input.match(/\b(?:after|in)\s+(\d+)\s*(h|hour|hours|d|day|days)\b/i)
  const timeWithinMatch = input.match(/\b(?:within|within\s+the\s+next)\s+(\d+)\s*(h|hour|hours|d|day|days)\b/i)
  const endOfDayMatch = /\b(?:at\s+)?end\s+of\s+day\b/i.test(input)
  
  if (timeAfterMatch || timeWithinMatch) {
    const match = timeAfterMatch || timeWithinMatch
    if (match) {
      timeLimit = parseFloat(match[1])
      const unit = match[2]?.toLowerCase() || ''
      timeUnit = unit.startsWith('h') ? 'h' : 'd'
    }
  } else if (endOfDayMatch) {
    timeLimit = 24
    timeUnit = 'h'
  }
  
  // Extract trailing stop conditions
  let trailingStop: number | undefined
  const trailingStopMatch = input.match(/\b(?:trailing\s+stop|price\s+drops?|drawdown)\s+(?:from\s+peak|below\s+highest|from\s+entry)\s+(\d+(?:\.\d+)?)%/i)
  const trailingStopSimpleMatch = input.match(/\b(?:price\s+drops?\s+)?(\d+(?:\.\d+)?)%\s+(?:from\s+peak|below\s+highest|from\s+entry|from\s+high)/i)
  
  if (trailingStopMatch) {
    trailingStop = parseFloat(trailingStopMatch[1])
  } else if (trailingStopSimpleMatch) {
    trailingStop = parseFloat(trailingStopSimpleMatch[1])
  }
  
  // Extract Polymarket-specific exit conditions
  
  // Event probability momentum (e.g., "probability drops 5% in 1h", "probability accelerates > 2%/h")
  let probabilityMomentum: number | undefined
  let probabilityMomentumDirection: 'DROP' | 'ACCELERATE' | 'REVERSE' | undefined
  const probDropMatch = input.match(/\bprobability\s+drops\s+(\d+(?:\.\d+)?)%\s+in\s+(\d+)\s*(h|hour)/i)
  const probAccelMatch = input.match(/\bprobability\s+accelerates?\s*(?:>|>=)\s*(\d+(?:\.\d+)?)%\/h/i)
  if (probDropMatch) {
    probabilityMomentum = parseFloat(probDropMatch[1])
    probabilityMomentumDirection = 'DROP'
  } else if (probAccelMatch) {
    probabilityMomentum = parseFloat(probAccelMatch[1])
    probabilityMomentumDirection = 'ACCELERATE'
  } else if (/\bprobability\s+momentum\s+reverses/i.test(input)) {
    probabilityMomentumDirection = 'REVERSE'
  }
  
  // Event resolution deadline (e.g., "if event resolves before probability reaches 75%", "if less than 24h until event resolution")
  let resolutionDeadline: number | undefined
  let resolutionDeadlineCondition: 'BEFORE_THRESHOLD' | 'TIME_REMAINING' | undefined
  if (/\bevent\s+resolves\s+before\s+probability/i.test(input)) {
    resolutionDeadlineCondition = 'BEFORE_THRESHOLD'
  } else {
    const timeRemainingMatch = input.match(/\b(?:less\s+than|if)\s+(\d+)\s*(h|hour)\s+until\s+event\s+resolution/i)
    if (timeRemainingMatch) {
      resolutionDeadline = parseFloat(timeRemainingMatch[1])
      resolutionDeadlineCondition = 'TIME_REMAINING'
    }
  }
  
  // Event market liquidity (e.g., "market liquidity drops below $500K", "market volume < $100K")
  let liquidityThreshold: number | undefined
  const liquidityMatch = input.match(/\b(?:market\s+)?liquidity\s+(?:drops\s+below|below|<\s*)\s*\$?(\d+(?:,\d+)*(?:\.\d+)?)\s*(K|M|B)?/i)
  const volumeMatch = input.match(/\b(?:market\s+)?volume\s*(?:<|drops\s+below)\s*\$?(\d+(?:,\d+)*(?:\.\d+)?)\s*(K|M|B)?/i)
  if (liquidityMatch) {
    let value = parseFloat(liquidityMatch[1].replace(/,/g, ''))
    const unit = liquidityMatch[2]?.toUpperCase() || ''
    if (unit === 'K') value *= 1000
    else if (unit === 'M') value *= 1000000
    else if (unit === 'B') value *= 1000000000
    liquidityThreshold = value
  } else if (volumeMatch) {
    let value = parseFloat(volumeMatch[1].replace(/,/g, ''))
    const unit = volumeMatch[2]?.toUpperCase() || ''
    if (unit === 'K') value *= 1000
    else if (unit === 'M') value *= 1000000
    else if (unit === 'B') value *= 1000000000
    liquidityThreshold = value
  }
  
  // Probability change rate (e.g., "probability change rate slows to < 0.5%/h", "probability change rate exceeds 5%/h")
  let probabilityChangeRate: number | undefined
  let probabilityChangeRateDirection: 'SLOW' | 'EXCEED' | undefined
  const changeRateSlowMatch = input.match(/\bprobability\s+change\s+rate\s+slows?\s+to\s*(?:<|below)\s*(\d+(?:\.\d+)?)%\/h/i)
  const changeRateExceedMatch = input.match(/\bprobability\s+change\s+rate\s+exceeds?\s*(?:>|>=)\s*(\d+(?:\.\d+)?)%\/h/i)
  if (changeRateSlowMatch) {
    probabilityChangeRate = parseFloat(changeRateSlowMatch[1])
    probabilityChangeRateDirection = 'SLOW'
  } else if (changeRateExceedMatch) {
    probabilityChangeRate = parseFloat(changeRateExceedMatch[1])
    probabilityChangeRateDirection = 'EXCEED'
  }
  
  // Probability threshold range (e.g., "probability drops below 50%", "probability exceeds 95%")
  let probabilityRangeMin: number | undefined
  let probabilityRangeMax: number | undefined
  const probBelowMatch = input.match(/\bprobability\s+drops?\s+below\s+(\d+(?:\.\d+)?)%/i)
  const probExceedMatch = input.match(/\bprobability\s+exceeds?\s+(\d+(?:\.\d+)?)%/i)
  const probRangeMatch = input.match(/\bprobability\s+falls?\s+outside\s+(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)%\s+range/i)
  if (probBelowMatch) {
    probabilityRangeMin = parseFloat(probBelowMatch[1])
  } else if (probExceedMatch) {
    probabilityRangeMax = parseFloat(probExceedMatch[1])
  } else if (probRangeMatch) {
    probabilityRangeMin = parseFloat(probRangeMatch[1])
    probabilityRangeMax = parseFloat(probRangeMatch[2])
  }
  
  // Extract exit logic (ANY vs ALL)
  let exitLogic: 'ALL' | 'ANY' = 'ALL' // Default: all conditions must be met
  if (/\b(?:any|or)\s+condition/i.test(input)) {
    exitLogic = 'ANY'
  } else if (/\b(?:all|and)\s+condition/i.test(input)) {
    exitLogic = 'ALL'
  }
  
  // Extract asset (may not be present for position management commands)
  const assetMatch = lowerInput.match(/\b(eth|btc|sol|avax|matic|arb|op)\b/i)
  const asset = assetMatch ? assetMatch[0].toUpperCase() + '-PERP' : 'ETH-PERP'
  
  // Extract action (for new positions, not position management)
  const isLong = /\b(long|buy)\b/i.test(input) && !isPositionManagement
  const isShort = /\b(short|sell)\b/i.test(input) && !isPositionManagement
  const action = isShort ? 'SHORT' : 'LONG'
  
  // Extract conditions - Polymarket events, OI, and Price
  const conditions: ParsedStrategy['conditions'] = []
  
  // Multi-event logic detection (AND/OR)
  let eventLogic: 'AND' | 'OR' = 'AND' // Default: all events must trigger
  if (/\b(any|or)\s+(?:event|polymarket)/i.test(input) || /\bevent\s+(?:a|one|either)/i.test(input)) {
    eventLogic = 'OR'
  } else if (/\b(all|and|both)\s+(?:event|polymarket)/i.test(input) || /\bevent\s+(?:a|1)\s+and\s+event\s+(?:b|2)/i.test(input)) {
    eventLogic = 'AND'
  }
  
  // Dynamic position sizing - explicit adjustments based on probability thresholds
  const positionAdjustments: { probability: number; adjustment: number; direction: 'INCREASE' | 'DECREASE' }[] = []
  
  // Match patterns like:
  // "increase position by 50% if probability reaches 80%"
  // "decrease position by 25% if probability drops to 60%"
  // "add 30% to position when probability hits 75%"
  // "reduce position by 20% if probability falls to 55%"
  // More flexible pattern that handles variations
  const allIncreaseMatches = input.matchAll(/\b(?:increase|add|scale up|grow)\s+(?:position|size|exposure)\s+(?:by|to)\s+(\d+(?:\.\d+)?)%\s+(?:if|when|after)\s+(?:probability|prob)\s+(?:reaches|hits|exceeds|>=)\s+(\d+(?:\.\d+)?)%/gi)
  for (const match of allIncreaseMatches) {
    const adjustment = parseFloat(match[1])
    const probability = parseFloat(match[2])
    positionAdjustments.push({
      probability,
      adjustment,
      direction: 'INCREASE'
    })
  }
  
  const allDecreaseMatches = input.matchAll(/\b(?:decrease|reduce|scale down|cut)\s+(?:position|size|exposure)\s+(?:by|to)\s+(\d+(?:\.\d+)?)%\s+(?:if|when|after)\s+(?:probability|prob)\s+(?:drops?|falls?|<=|below)\s+(?:to\s+)?(\d+(?:\.\d+)?)%/gi)
  for (const match of allDecreaseMatches) {
    const adjustment = parseFloat(match[1])
    const probability = parseFloat(match[2])
    positionAdjustments.push({
      probability,
      adjustment: -adjustment, // Negative for decrease
      direction: 'DECREASE'
    })
  }
  
  // Remove duplicates (same probability threshold)
  const uniqueAdjustments = positionAdjustments.filter((adj, index, self) =>
    index === self.findIndex(a => a.probability === adj.probability && a.direction === adj.direction)
  )
  
  // Sort by probability (ascending)
  uniqueAdjustments.sort((a, b) => a.probability - b.probability)
  
  // Use unique adjustments
  positionAdjustments.length = 0
  positionAdjustments.push(...uniqueAdjustments)
  
  // Polymarket event conditions - support multiple events
  const polymarketMatches = input.matchAll(/(?:polymarket|event|market)\s+["']([^"']+)["']\s+(?:probability|prob|reaches|hits|exceeds)\s+(\d+(?:\.\d+)?)%/gi)
  const eventArray = Array.from(polymarketMatches)
  
  if (eventArray.length > 0) {
    // Multiple events detected
    for (const match of eventArray) {
      const eventName = match[1].trim()
      const prob = parseFloat(match[2])
      
      conditions.push({
        type: 'event',
        eventType: 'polymarket',
        description: `Polymarket: ${eventName} probability ≥ ${prob}%`,
        value: prob,
        probability: prob,
        marketId: eventName.toLowerCase().replace(/\s+/g, '-')
      })
    }
  } else if (/\b(polymarket|prediction market|event|probability|prob)\b/i.test(input)) {
    // Single event - legacy parsing
    const probMatch = input.match(/(\d+(?:\.\d+)?)%?\s*(?:probability|prob|chance)/i)
    const prob = probMatch ? parseFloat(probMatch[1]) : 70
    const eventMatch = input.match(/["']([^"']+)["']|(?:polymarket|if|when|after)\s+["']?([^"']+)["']?\s+(?:probability|prob|reaches|hits|exceeds)/i) ||
                       input.match(/["']([^"']+)["']|(?:if|when|after)\s+([^if|when|after]+?)\s+(?:probability|prob|reaches|hits|exceeds)/i)
    
    let eventName = 'Market Event'
    if (eventMatch) {
      eventName = (eventMatch[1] || eventMatch[2] || eventMatch[3] || 'Market Event').trim()
      eventName = eventName.replace(/\s+(probability|prob|reaches|hits|exceeds).*$/i, '')
    } else {
      const altMatch = input.match(/(?:polymarket|event|market)\s+["']?([^"']+)["']?/i)
      if (altMatch) {
        eventName = altMatch[1].trim()
      }
    }
    
    conditions.push({
      type: 'event',
      eventType: 'polymarket',
      description: `Polymarket: ${eventName} probability ≥ ${prob}%`,
      value: prob,
      probability: prob,
      marketId: eventName.toLowerCase().replace(/\s+/g, '-')
    })
  }
  
  // OI conditions - more realistic: absolute levels or time-based changes
  if (/\b(oi|open interest)\b/i.test(input)) {
    // Check for absolute OI level (e.g., "OI above $2B", "OI > 1.5B", "OI exceeds 2B")
    const absoluteMatch = input.match(/oi\s+(?:above|over|>|exceeds|breaks)\s+\$?(\d+(?:\.\d+)?)\s*([bm])?/i)
    if (absoluteMatch) {
      const level = parseFloat(absoluteMatch[1])
      const unit = absoluteMatch[2]?.toLowerCase() || ''
      const multiplier = unit === 'b' ? 1000000000 : unit === 'm' ? 1000000 : 1000000000 // Default to billions
      const displayValue = level * (unit === 'b' ? 1 : unit === 'm' ? 0.001 : 1)
      conditions.push({
        type: 'oi',
        eventType: 'oi',
        description: `OI above $${displayValue.toFixed(1)}B`,
        value: level * multiplier,
        isAbsolute: true
      })
    } else {
      // Time-based percentage change (e.g., "OI rises 3% over 1h", "OI increases 5% in 24h")
      const isRising = /\b(ris|increas|up|grow)\b/i.test(input)
      const percentMatch = input.match(/(\d+(?:\.\d+)?)%/)
      const percent = percentMatch ? parseFloat(percentMatch[1]) : 3
      
      // Extract time period - default to 1h if not specified
      let timePeriod = '1h'
      if (/\b(24h|24\s*hour|day|daily)\b/i.test(input)) {
        timePeriod = '24h'
      } else if (/\b(1h|1\s*hour|hourly)\b/i.test(input)) {
        timePeriod = '1h'
      } else if (/\b(7d|7\s*day|week|weekly)\b/i.test(input)) {
        timePeriod = '7d'
      }
      
      conditions.push({
        type: 'oi',
        eventType: 'oi',
        description: isRising ? `OI rises ${percent}% over ${timePeriod}` : `OI drops ${percent}% over ${timePeriod}`,
        value: percent,
        timePeriod: timePeriod,
        isAbsolute: false
      })
    }
  }
  
  // Price-based conditions
  if (/\b(price|above|below)\s+\$?(\d+(?:\.\d+)?)\b/i.test(input)) {
    const priceMatch = input.match(/\b(above|below)\s+\$?(\d+(?:\.\d+)?)\b/i)
    if (priceMatch) {
      const direction = priceMatch[1].toLowerCase()
      const price = parseFloat(priceMatch[2])
      conditions.push({
        type: 'price',
        eventType: 'price',
        description: `Price ${direction} $${price.toLocaleString()}`,
        value: price
      })
    }
  }
  
  // Add P&L-based condition
  if (pnlThreshold !== undefined && pnlType) {
    if (pnlType === 'PERCENTAGE') {
      conditions.push({
        type: 'pnl',
        eventType: 'trend',
        description: pnlThreshold >= 0 
          ? `P&L reaches +${pnlThreshold}%`
          : `P&L drops to ${pnlThreshold}%`,
        value: pnlThreshold
      })
    } else {
      conditions.push({
        type: 'pnl',
        eventType: 'trend',
        description: `Unrealized P&L ${pnlThreshold >= 0 ? 'reaches' : 'drops to'} $${Math.abs(pnlThreshold).toLocaleString()}`,
        value: pnlThreshold
      })
    }
  }
  
  // Add time-based condition
  if (timeLimit !== undefined && timeUnit) {
    conditions.push({
      type: 'time',
      eventType: 'trend',
      description: timeUnit === 'h' 
        ? `After ${timeLimit} hour${timeLimit !== 1 ? 's' : ''}`
        : `After ${timeLimit} day${timeLimit !== 1 ? 's' : ''}`,
      value: timeLimit,
      timePeriod: `${timeLimit}${timeUnit}`
    })
  }
  
  // Add trailing stop condition
  if (trailingStop !== undefined) {
    conditions.push({
      type: 'trailing_stop',
      eventType: 'price',
      description: `Price drops ${trailingStop}% from peak`,
      value: trailingStop
    })
  }
  
  // Extract leverage
  const leverageMatch = input.match(/(\d+)x\s*(?:leverage|lev)/i)
  const leverage = leverageMatch ? parseInt(leverageMatch[1]) : 2
  
  // Extract stop loss
  const stopMatch = input.match(/stop[:\s]+(\d+(?:\.\d+)?)%/i)
  const stopLoss = stopMatch ? parseFloat(stopMatch[1]) : 2.0
  
  // Extract take profit
  const tpMatch = input.match(/(?:take profit|tp)[:\s]+(\d+(?:\.\d+)?)%/i)
  const takeProfit = tpMatch ? parseFloat(tpMatch[1]) : 4.0
  
  // Generate strategy name
  const name = `${asset.split('-')[0]} ${conditions[0]?.type.toUpperCase() || 'Momentum'} ${action}`
  
  // Collect warnings
  const warnings: string[] = []
  const hasPolymarketEvent = conditions.some(c => c.eventType === 'polymarket')
  
  // Enforce Polymarket event requirement - this system only supports event-aware conditional orders
  // Traditional limit orders (price-only) should use standard trading terminals
  if (conditions.length === 0) {
    if (isPositionManagement) {
      warnings.push('No exit conditions detected. Please specify at least one Polymarket event. Traditional limit orders are not supported - use a standard trading terminal for price-based orders.')
    } else {
      warnings.push('No conditions detected. Please specify at least one Polymarket event. This system only supports event-aware conditional orders, not traditional limit orders.')
    }
  } else if (!hasPolymarketEvent) {
    if (isPositionManagement) {
      warnings.push('Polymarket event required for exit condition. Price-only conditions are not supported - use a standard trading terminal for traditional limit orders.')
    } else {
      warnings.push('Polymarket event required. This system only supports event-aware conditional orders. For traditional limit orders, use a standard trading terminal.')
    }
  }
  if (!/\b(long|short|buy|sell)\b/i.test(input)) {
    warnings.push('Action not explicitly specified. Defaulting to LONG.')
  }
  if (leverage > 10) {
    warnings.push(`High leverage (${leverage}x) detected. Ensure proper risk management.`)
  }
  
  // Generate strategy name
  let strategyName = name
  if (isPositionManagement) {
    if (positionAction === 'CLOSE') {
      strategyName = `Close Position: ${conditions[0]?.description || 'Exit Condition'}`
    } else if (positionAction === 'REVERSE') {
      strategyName = `Reverse Position: ${conditions[0]?.description || 'Reverse Condition'}`
    } else if (positionAction === 'CANCEL') {
      strategyName = `Cancel Position: ${conditions[0]?.description || 'Cancel Condition'}`
    }
  }
  
  
  return {
    asset,
    action,
    conditions,
    leverage,
    stopLoss,
    takeProfit,
    name: strategyName,
    naturalLanguage: originalInput,
    warnings: warnings.length > 0 ? warnings : undefined,
    isPositionManagement,
    positionAction,
    positionId: positionId || (isPositionManagement ? undefined : undefined), // Extract from input if present
    // Advanced position management fields (Polymarket-specific)
    positionSize: isPositionManagement && positionSize !== 100 ? positionSize : undefined,
    exitLogic: isPositionManagement && exitLogic === 'ANY' ? 'ANY' : undefined, // Only set if explicitly ANY
    // Polymarket-specific exit conditions
    probabilityMomentum,
    probabilityMomentumDirection,
    resolutionDeadline,
    resolutionDeadlineCondition,
    liquidityThreshold,
    probabilityChangeRate,
    probabilityChangeRateDirection,
    probabilityRangeMin,
    probabilityRangeMax,
    // Multi-event strategy support
    eventLogic: conditions.filter(c => c.eventType === 'polymarket').length > 1 ? eventLogic : undefined,
  // Dynamic position sizing - explicit adjustments
  positionAdjustments: positionAdjustments.length > 0 ? positionAdjustments : undefined,
  // P&L-based exits
  pnlThreshold: pnlThreshold !== undefined ? pnlThreshold : undefined,
  pnlType: pnlType,
  // Time-based exits
  timeLimit: timeLimit !== undefined ? timeLimit : undefined,
  timeUnit: timeUnit,
  // Trailing stop
  trailingStop: trailingStop !== undefined ? trailingStop : undefined
  }
}

// Enhanced parser with validation and suggestions
export function parseStrategyWithValidation(input: string): ParseResult {
  if (!input || input.trim().length < 5) {
    return {
      success: false,
      error: 'Input too short. Please provide a more detailed strategy description.',
      suggestions: [
        'Long BTC if funding flips negative',
        'Short ETH when volume spikes',
        'Long SOL if OI rises 5%'
      ]
    }
  }

  try {
    const strategy = parseStrategy(input)
    
    // Validate minimum requirements
    const hasPolymarketEvent = strategy.conditions.some(c => c.eventType === 'polymarket')
    
    if (strategy.conditions.length === 0 && !/\b(always|immediate|now)\b/i.test(input)) {
      return {
        success: false,
        error: 'No conditions detected. This system only supports event-aware conditional orders. Please specify at least one Polymarket event. For traditional limit orders, use a standard trading terminal.',
        suggestions: [
          'Long ETH if Polymarket "Ethereum ETF Approval" probability ≥ 75%',
          'Long BTC when Polymarket "Bitcoin hits $100k" probability ≥ 80% and OI rises 5% over 24h',
          'Short ETH if Polymarket "Fed cuts rates" probability ≥ 70% and price above $3500'
        ]
      }
    }
    
    if (!hasPolymarketEvent) {
      return {
        success: false,
        error: 'Polymarket event required. This system only supports event-aware conditional orders, not traditional limit orders. For price-based limit orders, use a standard trading terminal.',
        suggestions: [
          'Long ETH if Polymarket "Ethereum ETF Approval" probability ≥ 75%',
          'Long BTC when Polymarket "Bitcoin hits $100k" probability ≥ 80% and OI rises 5% over 24h',
          'Short ETH if Polymarket "Fed cuts rates" probability ≥ 70% and price above $3500'
        ]
      }
    }

    return {
      success: true,
      strategy
    }
  } catch (error) {
    return {
      success: false,
      error: 'Failed to parse strategy. Please check your syntax.',
      suggestions: [
        'Use format: [Long/Short] [Asset] if Polymarket "[Event]" probability ≥ X% [and additional conditions]',
        'Example: "Long ETH if Polymarket \"Ethereum ETF Approval\" probability ≥ 75%"',
        'Example: "Long BTC when Polymarket \"Bitcoin hits $100k\" probability ≥ 80% and OI rises 5% over 24h"',
        'Example: "Short ETH if Polymarket \"Fed cuts rates\" probability ≥ 70% and price above $3500"'
      ]
    }
  }
}

