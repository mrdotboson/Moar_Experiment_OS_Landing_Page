# Polymarket-Specific Conditional Orders

## Core Philosophy
These are **event-aware conditional orders** that can only be executed with Polymarket integration. They're not generic trading terminal features - they're unique to event-driven trading.

## Current Features
✅ Close/Reverse/Cancel position based on Polymarket event probability thresholds
✅ Multiple event conditions per order
✅ Event + Market condition combinations (OI, Price)

## Polymarket-Specific Features to Add

### 1. **Event Probability Momentum Exits**
**Use Case:** Exit based on probability velocity, not just threshold
- `Close position if Polymarket "Event" probability drops 5% in 1h`
- `Reverse position if event probability accelerates > 2%/h`
- `Close if probability momentum reverses (was rising, now falling)`

**Why Polymarket-Specific:** Only Polymarket provides real-time probability velocity data

### 2. **Event Resolution Deadline Exits**
**Use Case:** Exit before event resolves if conditions not met
- `Close position if event resolves before probability reaches 75%`
- `Close 50% if less than 24h until event resolution and probability < 70%`
- `Cancel order if event resolves in < 12h and probability still below threshold`

**Why Polymarket-Specific:** Event resolution dates are Polymarket market metadata

### 3. **Event Market Liquidity Conditions**
**Use Case:** Only execute if Polymarket market has sufficient liquidity
- `Close position if Polymarket "Event" market liquidity drops below $500K`
- `Close if event market volume < $100K in 24h`
- `Cancel if event market becomes illiquid`

**Why Polymarket-Specific:** Polymarket market liquidity is unique to prediction markets

### 4. **Probability Change Rate Exits**
**Use Case:** Exit based on how fast probability is changing
- `Close position if Polymarket "Event" probability change rate slows to < 0.5%/h`
- `Close if probability change rate exceeds 5%/h (too volatile)`
- `Reverse if probability change rate reverses direction`

**Why Polymarket-Specific:** Probability change rates are unique to prediction markets

### 5. **Event Correlation Exits**
**Use Case:** Exit based on related events
- `Close position if Polymarket "Related Event" probability diverges > 20%`
- `Close if correlated event resolves opposite to main event`
- `Reverse if inverse event probability reaches 80%`

**Why Polymarket-Specific:** Event correlation analysis requires Polymarket market data

### 6. **Partial Exits Based on Probability Milestones**
**Use Case:** Scale out as event probability reaches milestones
- `Close 25% of position when Polymarket "Event" probability reaches 60%`
- `Close another 25% at 70%, 50% at 80%`
- `Scale out 10% every 5% probability increase`

**Why Polymarket-Specific:** Probability milestones are unique to prediction markets

### 7. **Event State Change Exits**
**Use Case:** Exit when event enters different state
- `Close position if Polymarket "Event" market closes (before resolution)`
- `Close if event market is paused/suspended`
- `Cancel if event market is delisted`

**Why Polymarket-Specific:** Event state changes are Polymarket platform events

### 8. **Probability Threshold Range Exits**
**Use Case:** Exit if probability moves outside acceptable range
- `Close position if Polymarket "Event" probability drops below 50% (after being above 70%)`
- `Close if probability exceeds 95% (overbought)`
- `Reverse if probability falls outside 60-80% range`

**Why Polymarket-Specific:** Probability ranges are unique to prediction markets

### 9. **Event Market Sentiment Shifts**
**Use Case:** Exit based on market sentiment changes
- `Close position if Polymarket "Event" market sentiment shifts from bullish to bearish`
- `Close if large bet (>$100K) placed against event`
- `Reverse if market makers pull liquidity`

**Why Polymarket-Specific:** Sentiment analysis requires Polymarket order book data

### 10. **Multi-Event Conditional Logic**
**Use Case:** Complex event combinations
- `Close position if Polymarket "Event A" probability ≥ 75% AND "Event B" probability < 30%`
- `Close if ANY of 3 related events reaches 80%`
- `Reverse if primary event probability > 70% but secondary event probability drops < 40%`

**Why Polymarket-Specific:** Multi-event correlation requires Polymarket market data

### 11. **Event Resolution Outcome Exits**
**Use Case:** Exit based on how event resolves
- `Close position if Polymarket "Event" resolves YES before threshold reached`
- `Close if event resolves NO (opposite to position direction)`
- `Cancel if event resolves before order can execute`

**Why Polymarket-Specific:** Event resolution outcomes are Polymarket-specific

### 12. **Probability Volatility Exits**
**Use Case:** Exit if probability becomes too volatile
- `Close position if Polymarket "Event" probability volatility exceeds 3%/h`
- `Close if probability swings > 10% in either direction within 1h`
- `Cancel if probability becomes too unstable`

**Why Polymarket-Specific:** Probability volatility is unique to prediction markets

## Implementation Priority

### Phase 1 (Core Polymarket Features)
1. **Event Probability Momentum Exits** - Most actionable
2. **Event Resolution Deadline Exits** - Critical for time-sensitive events
3. **Partial Exits Based on Probability Milestones** - Professional scaling

### Phase 2 (Advanced Event Features)
4. **Probability Change Rate Exits** - Sophisticated traders
5. **Event Market Liquidity Conditions** - Risk management
6. **Probability Threshold Range Exits** - Dynamic risk management

### Phase 3 (Complex Event Logic)
7. **Multi-Event Conditional Logic** - Power users
8. **Event Correlation Exits** - Advanced strategies
9. **Event State Change Exits** - Edge cases

## Natural Language Examples

### Probability Momentum
- "Close position if Polymarket 'Event' probability drops 5% in 1h"
- "Reverse position if event probability accelerates > 2%/h"
- "Close if probability momentum reverses"

### Resolution Deadlines
- "Close position if event resolves before probability reaches 75%"
- "Close 50% if less than 24h until event resolution and probability < 70%"
- "Cancel order if event resolves in < 12h and probability still below threshold"

### Market Liquidity
- "Close position if Polymarket 'Event' market liquidity drops below $500K"
- "Close if event market volume < $100K in 24h"
- "Cancel if event market becomes illiquid"

### Probability Milestones
- "Close 25% of position when Polymarket 'Event' probability reaches 60%"
- "Close another 25% at 70%, 50% at 80%"
- "Scale out 10% every 5% probability increase"

### Probability Ranges
- "Close position if Polymarket 'Event' probability drops below 50% (after being above 70%)"
- "Close if probability exceeds 95% (overbought)"
- "Reverse if probability falls outside 60-80% range"

### Multi-Event
- "Close position if Polymarket 'Event A' probability ≥ 75% AND 'Event B' probability < 30%"
- "Close if ANY of 3 related events reaches 80%"
- "Reverse if primary event probability > 70% but secondary event probability drops < 40%"

