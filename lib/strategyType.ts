import { ParsedStrategy } from './strategyParser'

export type StrategyCategory = 'event-driven' | 'metrics-driven' | 'hybrid'

export interface StrategyTypeInfo {
  category: StrategyCategory
  hasPolymarket: boolean
  hasMetrics: boolean
  primaryConditionType: string
  timeHorizon: 'event' | 'continuous' | 'mixed'
  riskProfile: 'binary' | 'continuous' | 'mixed'
}

/**
 * Analyzes a strategy to determine its type and characteristics
 */
export function analyzeStrategyType(strategy: ParsedStrategy): StrategyTypeInfo {
  const hasPolymarket = strategy.conditions.some(c => c.eventType === 'polymarket')
  const hasMetrics = strategy.conditions.some(c => 
    ['funding', 'oi', 'volume', 'trend', 'price'].includes(c.eventType || '')
  )
  
  let category: StrategyCategory = 'metrics-driven'
  if (hasPolymarket && !hasMetrics) {
    category = 'event-driven'
  } else if (hasPolymarket && hasMetrics) {
    category = 'hybrid'
  }
  
  const primaryConditionType = strategy.conditions[0]?.eventType || 'unknown'
  
  let timeHorizon: 'event' | 'continuous' | 'mixed' = 'continuous'
  if (hasPolymarket && !hasMetrics) {
    timeHorizon = 'event'
  } else if (hasPolymarket && hasMetrics) {
    timeHorizon = 'mixed'
  }
  
  let riskProfile: 'binary' | 'continuous' | 'mixed' = 'continuous'
  if (hasPolymarket && !hasMetrics) {
    riskProfile = 'binary'
  } else if (hasPolymarket && hasMetrics) {
    riskProfile = 'mixed'
  }
  
  return {
    category,
    hasPolymarket,
    hasMetrics,
    primaryConditionType,
    timeHorizon,
    riskProfile
  }
}

/**
 * Gets UI adaptations based on strategy type
 */
export function getUIAdaptations(strategy: ParsedStrategy) {
  const typeInfo = analyzeStrategyType(strategy)
  
  return {
    // Header/title adaptations
    strategyLabel: typeInfo.category === 'event-driven' 
      ? 'EVENT-AWARE STRATEGY'
      : typeInfo.category === 'hybrid'
      ? 'HYBRID EVENT + METRICS STRATEGY'
      : 'METRICS-BASED STRATEGY',
    
    // Primary focus panel
    primaryPanel: typeInfo.hasPolymarket 
      ? 'event-monitoring' 
      : 'metrics-monitoring',
    
    // Show event-specific UI elements
    showEventDeadline: typeInfo.hasPolymarket,
    showEventMarket: typeInfo.hasPolymarket,
    showProbabilityTracking: typeInfo.hasPolymarket,
    
    // Show metrics-specific UI elements
    showMetricsHistory: typeInfo.hasMetrics,
    showRealTimeMetrics: typeInfo.hasMetrics,
    showTrendAnalysis: typeInfo.hasMetrics,
    
    // Risk display adaptations
    riskDisplayType: typeInfo.riskProfile === 'binary' 
      ? 'event-outcome' 
      : typeInfo.riskProfile === 'mixed'
      ? 'combined'
      : 'continuous',
    
    // Time context
    showCountdown: typeInfo.timeHorizon === 'event' || typeInfo.timeHorizon === 'mixed',
    showContinuousMonitoring: typeInfo.timeHorizon === 'continuous' || typeInfo.timeHorizon === 'mixed',
    
    // Panel priorities (which panels to emphasize)
    emphasizedPanels: typeInfo.hasPolymarket
      ? ['event-status', 'probability-tracker', 'condition-status']
      : ['metrics-dashboard', 'condition-status', 'live-signals'],
    
    // Additional context
    typeInfo
  }
}

