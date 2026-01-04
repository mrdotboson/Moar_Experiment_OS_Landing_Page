/**
 * Shared type definitions for Deploy Terminal
 *
 * This file centralizes all TypeScript interfaces and types used across
 * the application for better maintainability and type safety.
 */

// =============================================================================
// Flow State Types
// =============================================================================

/**
 * Represents the current state in the application flow
 */
export type FlowState =
  | 'start'
  | 'typing'
  | 'parsing'
  | 'graph'
  | 'spec'
  | 'simulation'
  | 'reveal'

// =============================================================================
// Market Data Types
// =============================================================================

/**
 * Hyperliquid perpetual market data
 */
export interface HyperliquidMarket {
  symbol: string
  price: number
  volume24h: number
  change24h: number // percentage change
  volume24hUsd: number
}

/**
 * Polymarket prediction market data
 */
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
  rules?: string
  description?: string
}

// =============================================================================
// Position Types
// =============================================================================

/**
 * Exit condition status for a position
 */
export type ExitConditionStatus = 'PENDING' | 'TRIGGERED' | 'CANCELLED'

/**
 * Exit condition attached to a position
 */
export interface ExitCondition {
  type: string
  description: string
  status: ExitConditionStatus
}

/**
 * Trading position data
 */
export interface Position {
  id: string
  asset: string
  direction: 'Long' | 'Short'
  entryPrice: number
  currentPrice: number
  size: number
  leverage: number
  unrealizedPnl: number
  unrealizedPnlPercent: number
  entryTime: string
  liquidationPrice?: number
  priceChange?: 'up' | 'down'
  exitConditions?: ExitCondition[]
}

// =============================================================================
// Strategy Types
// =============================================================================

/**
 * Types of events that can trigger strategy conditions
 */
export type StrategyEventType = 'polymarket' | 'price' | 'funding' | 'oi' | 'volume' | 'trend'

/**
 * Actions that can be taken on positions
 */
export type PositionAction = 'CLOSE' | 'REVERSE' | 'CANCEL'

/**
 * Trading direction
 */
export type TradeAction = 'LONG' | 'SHORT'

/**
 * Logic for combining multiple conditions
 */
export type ConditionLogic = 'AND' | 'OR' | 'ALL' | 'ANY'

/**
 * P&L threshold type
 */
export type PnLType = 'PERCENTAGE' | 'ABSOLUTE'

/**
 * Time unit for time-based conditions
 */
export type TimeUnit = 'h' | 'd'

/**
 * Probability momentum direction
 */
export type MomentumDirection = 'DROP' | 'ACCELERATE' | 'REVERSE'

/**
 * Probability change rate direction
 */
export type ChangeRateDirection = 'SLOW' | 'EXCEED'

/**
 * Resolution deadline condition type
 */
export type ResolutionDeadlineCondition = 'BEFORE_THRESHOLD' | 'TIME_REMAINING'

/**
 * Position adjustment for dynamic sizing
 */
export interface PositionAdjustment {
  probability: number
  adjustment: number
  direction: 'INCREASE' | 'DECREASE'
}

/**
 * Strategy condition
 */
export interface StrategyCondition {
  type: string
  description: string
  value?: string | number
  eventType?: StrategyEventType
  marketId?: string
  probability?: number
  timePeriod?: string
  isAbsolute?: boolean
}

// =============================================================================
// API Response Types
// =============================================================================

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

/**
 * Early access signup response
 */
export interface EarlyAccessResponse {
  success: boolean
  id?: number
  error?: string
}

// =============================================================================
// Component Props Types
// =============================================================================

/**
 * Props for components that can be embedded in tabs
 */
export interface EmbeddableProps {
  embedded?: boolean
}

/**
 * Props for components that support auto-advance
 */
export interface AutoAdvanceProps {
  autoAdvance?: boolean
}
