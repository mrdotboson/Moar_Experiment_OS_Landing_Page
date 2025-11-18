# Additional Position Management Features

## Current Features
✅ Close position if conditions met
✅ Reverse position when conditions met
✅ Cancel position if conditions met
✅ Multiple exit conditions per position
✅ Event-aware exit conditions (Polymarket)

## High-Priority Features to Add

### 1. **Partial Position Management**
**Use Case:** Scale out of positions gradually
- `Close 50% of position if Polymarket "Event" probability ≥ 75%`
- `Reduce position by 25% when price above $3500`
- `Scale out 10% every hour if P&L > 5%`

**Implementation:**
- Add `positionSize?: number` (percentage or absolute) to ParsedStrategy
- Default to 100% if not specified
- Show in UI: "Close 50% of position" vs "Close position"

### 2. **Profit Target Exits**
**Use Case:** Take profit based on P&L, not just events
- `Close position if P&L reaches +5%`
- `Close 50% if unrealized P&L > $1000`
- `Reverse position if P&L drops to -3%`

**Implementation:**
- Add `pnlThreshold?: number` and `pnlType?: 'PERCENTAGE' | 'ABSOLUTE'`
- Parse: "P&L reaches X%", "unrealized P&L > $X"
- Monitor in real-time P&L panel

### 3. **Time-Based Exits**
**Use Case:** Close position after time period regardless of conditions
- `Close position after 24h if not triggered`
- `Close position at end of day if P&L > 0`
- `Cancel position if not filled within 1h`

**Implementation:**
- Add `timeLimit?: number` and `timeUnit?: 'h' | 'd'`
- Parse: "after 24h", "within 1h", "at end of day"
- Show countdown timer in monitoring

### 4. **Trailing Stop Loss**
**Use Case:** Dynamic stop that follows price
- `Close position if price drops 2% from peak`
- `Trailing stop: 3% below highest price`
- `Close if drawdown from entry > 5%`

**Implementation:**
- Add `trailingStop?: number` (percentage)
- Track peak price since entry
- Trigger when current price < (peak * (1 - trailingStop/100))

### 5. **Exit Condition Logic (ANY vs ALL)**
**Use Case:** Different trigger logic for exit conditions
- `Close position if ANY condition is met` (default: ALL)
- `Close if Polymarket event OR P&L > 10%`
- `Close if ALL conditions AND time > 24h`

**Implementation:**
- Add `exitLogic?: 'ALL' | 'ANY'` to ParsedStrategy
- Parse: "if ANY", "if ALL", "if X OR Y"
- Default to 'ALL' for safety

### 6. **Position Modification**
**Use Case:** Adjust existing positions
- `Increase position size by 50% if Polymarket event probability ≥ 80%`
- `Reduce leverage to 2x if VaR > $5000`
- `Add $1000 to position when price drops 5%`

**Implementation:**
- Add `modifyAction?: 'INCREASE' | 'DECREASE' | 'SET'`
- Add `modifyAmount?: number` and `modifyType?: 'PERCENTAGE' | 'ABSOLUTE'`
- Parse: "increase by X%", "reduce to $X", "add $X"

### 7. **Exit Order Types** (REMOVED)
**Note:** Traditional limit orders removed - use standard trading terminals for price-based limit orders. This system focuses exclusively on event-aware conditional orders.

### 8. **Position Alerts**
**Use Case:** Get notified before exit triggers
- `Alert when exit condition is 80% met`
- `Notify if P&L reaches 90% of target`
- `Alert when time remaining < 1h`

**Implementation:**
- Add `alertThreshold?: number` (percentage)
- Show alert badge in monitoring panel
- Could integrate with notifications API

### 9. **Bracket Orders**
**Use Case:** Set stop loss and take profit simultaneously
- `Set bracket: stop loss -2%, take profit +5%`
- `Close position if stop loss OR take profit hit`
- `Close if P&L < -2% OR P&L > 5% OR event triggers`

**Implementation:**
- Already have stopLoss/takeProfit, but make them exit conditions
- Parse: "bracket: -2% / +5%", "stop loss -2% or take profit +5%"
- Show as multiple exit conditions

### 10. **OCO (One-Cancels-Other) Orders**
**Use Case:** Multiple exit strategies, only one executes
- `Close at profit +5% OR close if event probability drops below 50%`
- `Close if P&L > 10% OR close if time > 48h (whichever first)`

**Implementation:**
- Add `isOCO?: boolean` flag
- Parse: "OR" keyword indicates OCO logic
- When one triggers, cancel others

### 11. **Position Notes/Tags**
**Use Case:** Add context to positions
- `Tag position: "ETF play"`
- `Add note: "High conviction, hold until event"`
- `Label: "Scalp trade"`

**Implementation:**
- Add `tags?: string[]` and `notes?: string`
- Parse: "tag: X", "note: Y", "label: Z"
- Display in Positions tab

### 12. **Position Cloning**
**Use Case:** Create similar position with different parameters
- `Clone position with 2x size`
- `Copy position but change leverage to 3x`
- `Duplicate position for different asset`

**Implementation:**
- Add `cloneFrom?: string` (position ID)
- Parse: "clone position", "copy position"
- Pre-fill form with existing position data

### 13. **Exit Condition Editing**
**Use Case:** Modify existing exit conditions
- `Update exit condition: change threshold to 80%`
- `Remove exit condition: price above $3500`
- `Add exit condition: P&L > 10%`

**Implementation:**
- Allow editing in Positions tab
- Parse: "update", "remove", "add" keywords
- Show edit button on each exit condition

### 14. **Position Grouping**
**Use Case:** Manage related positions together
- `Group positions: "ETF strategy"`
- `Close all positions in group if event triggers`
- `Show aggregate P&L for group`

**Implementation:**
- Add `groupId?: string` to positions
- Parse: "group: X", "close group"
- Show grouped view in Positions tab

### 15. **Risk-Based Exits**
**Use Case:** Exit based on risk metrics
- `Close position if VaR > $5000`
- `Close if drawdown exceeds 5%`
- `Close if exposure > position limit`

**Implementation:**
- Add `riskMetric?: 'VaR' | 'DRAWDOWN' | 'EXPOSURE'`
- Add `riskThreshold?: number`
- Parse: "if VaR > $X", "if drawdown > X%"

## Recommended Implementation Order

### Phase 1 (Critical - Most Used)
1. **Partial Position Management** - Essential for professional trading
2. **Profit Target Exits** - Natural complement to event-based exits
3. **Trailing Stop Loss** - Standard risk management tool

### Phase 2 (High Value)
4. **Time-Based Exits** - Important for time-sensitive strategies
5. **Exit Condition Logic (ANY vs ALL)** - More flexibility
6. **Bracket Orders** - Common trading pattern

### Phase 3 (Nice to Have)
7. **Position Modification** - Advanced feature
8. **OCO Orders** - Complex but powerful
9. **Position Alerts** - UX enhancement
10. **Exit Condition Editing** - Workflow improvement

## Natural Language Examples

### Partial Exits
- "Close 50% of position if Polymarket 'Event' probability ≥ 75%"
- "Reduce position by 25% when price above $3500"
- "Scale out 10% every hour if P&L > 5%"

### Profit Targets
- "Close position if P&L reaches +5%"
- "Close 50% if unrealized P&L > $1000"
- "Take profit at +10% or close if event triggers"

### Time-Based
- "Close position after 24h if not triggered"
- "Close position at end of day if P&L > 0"
- "Cancel position if not filled within 1h"

### Trailing Stops
- "Close position if price drops 2% from peak"
- "Trailing stop: 3% below highest price"
- "Close if drawdown from entry > 5%"

### Combined
- "Close 50% of position if Polymarket 'Event' probability ≥ 75% OR P&L > 10%"
- "Close position if event triggers OR after 48h OR if P&L < -3%"
- "Trailing stop 2% from peak, but also close if event probability drops below 50%"

