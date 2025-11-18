# Position Monitoring Improvements for Close Position Prompts

## Overview
Enhance the live monitoring and positions tabs to provide quant traders with critical information when managing existing positions, especially for close position commands.

## Key Improvements

### 1. **Monitoring Tab - Position Management Mode**

#### A. Position Context Panel (New/Enhanced)
- **Position Being Managed**: Show actual position details
  - Position ID, Asset, Direction (LONG/SHORT)
  - Entry Price, Current Price, Entry Time
  - Position Size (notional), Leverage
  - Current Unrealized P&L (highlighted)
  - Time in Position

#### B. Exit Condition Progress (Enhanced)
- **Visual Progress Bars**: For each exit condition, show:
  - Current value vs Threshold
  - Progress percentage (0-100%)
  - Velocity (rate of change)
  - Estimated time to trigger (based on velocity)
  - Trend indicator (24h history)
  - Status (MET/PENDING/CLOSE)

#### C. Realized P&L Preview (New)
- **On Close**: Show what will be realized
  - Current Unrealized P&L
  - Realized P&L (if partial close, show for % being closed)
  - Remaining Position (if partial close)
  - Portfolio Impact (% of portfolio)
  - Capital Released (available for new positions)

#### D. Exit Action Summary (Enhanced)
- **Action Details**:
  - Close Type: Full (100%) or Partial (X%)
  - Exit Logic: ALL conditions vs ANY condition
  - What happens: Close, Reverse, or Cancel
  - Execution: Market order, Limit order, etc.

#### E. Time Estimates (New)
- **Estimated Time to Exit**:
  - Based on current velocity of exit conditions
  - Confidence interval (e.g., "2-4 hours" or "likely within 6h")
  - Countdown timer if close to trigger
  - Alert if conditions are moving away from trigger

### 2. **Positions Tab - Enhanced Exit Condition Display**

#### A. Position Cards (Enhanced)
- **Exit Condition Status Per Position**:
  - Visual progress indicators for each exit condition
  - Color-coded status (green = met, yellow = close, red = far)
  - Progress percentage
  - Time to trigger estimate

#### B. Exit Condition Details (New)
- **Expandable Condition Cards**:
  - Current value, threshold, progress
  - Velocity and trend
  - Historical context (1h/24h/7d)
  - Polymarket-specific: probability chart, volume, liquidity

#### C. Quick Actions (Enhanced)
- **Context-Aware Actions**:
  - "Modify Exit" - edit exit conditions
  - "Close Now" - immediate close (bypass conditions)
  - "Cancel Exit" - remove exit conditions
  - "View Details" - expand to see full monitoring

### 3. **Real-Time Updates**

#### A. Live Data Streaming
- **Auto-refresh**: Update every 1-2 seconds
- **Change Indicators**: Highlight what changed since last update
- **Alerts**: Visual/audio alerts when conditions are close to triggering

#### B. Velocity Tracking
- **Rate of Change**: Show how fast conditions are approaching trigger
- **Acceleration/Deceleration**: Indicate if conditions are speeding up or slowing down
- **Momentum**: Show if trend is likely to continue

### 4. **Portfolio Context**

#### A. Position Impact
- **Before Close**: Current portfolio state
- **After Close**: Projected portfolio state
- **Capital Allocation**: Show freed capital
- **Risk Reduction**: Show how closing affects overall portfolio risk

#### B. Correlation Awareness
- **Related Positions**: Show other positions that might be affected
- **Market Exposure**: Show net exposure after close
- **Diversification**: Show impact on portfolio diversification

## Implementation Priority

### Phase 1 (Critical - Immediate)
1. Position context panel showing actual position details
2. Exit condition progress bars with current vs threshold
3. Realized P&L preview
4. Time estimates based on velocity

### Phase 2 (High Value)
5. Visual progress indicators in positions tab
6. Expandable condition details
7. Live data streaming with change indicators
8. Velocity tracking and momentum

### Phase 3 (Nice to Have)
9. Portfolio impact analysis
10. Correlation awareness
11. Advanced alerts and notifications

## UI/UX Considerations

- **Bloomberg Terminal Aesthetic**: Dense, information-rich, monospace
- **Color Coding**: 
  - Green: Met/Triggered/Positive
  - Red: Not Met/Negative/Close Action
  - Orange: Warning/Reverse Action
  - Purple: Polymarket/Event-specific
- **Visual Hierarchy**: Most critical info (P&L, exit status) at top
- **Progressive Disclosure**: Summary first, details on expand
- **Real-time Feel**: Smooth updates, no jarring changes


