# Position Management Design

## Narrative & User Flow

### Current Flow:
1. **Terminal** → Create new conditional order
2. **Spec** → Review strategy configuration
3. **Reveal** → Monitor and deploy

### Enhanced Flow with Position Management:
1. **Terminal** → Create new conditional order OR manage existing positions
2. **Spec** → Review strategy configuration
3. **Reveal** → Monitor active positions + deploy new orders

## Key Features to Add

### 1. **Position Management Commands in Terminal**
- `Close position if Polymarket "Event" probability ≥ X%`
- `Reverse position when Polymarket "Event" probability ≥ X% and price above $Y`
- `Cancel position if OI drops 5% over 24h`

### 2. **Active Positions Panel in CatalystReveal**
- Show all open positions
- Each position shows:
  - Entry details (asset, size, direction, entry price)
  - Current P&L (unrealized)
  - Exit conditions (if any)
  - Status (ACTIVE, EXIT PENDING, etc.)

### 3. **Exit Condition Management**
- Similar to entry conditions but for closing/reversing
- Event-aware exit conditions
- Can add multiple exit conditions per position

## Implementation Approach

### Option A: Separate Position Management Mode (Recommended)
- Add "Position Management" mode toggle in terminal
- When enabled, commands are for managing existing positions
- Shows list of active positions
- Can create exit conditions for each position

### Option B: Unified Command Interface
- Terminal accepts both entry and exit commands
- Parser detects intent (new order vs. position management)
- CatalystReveal shows both pending orders and active positions

### Option C: Position Management Tab
- Add new tab in CatalystReveal: "Positions"
- Shows all active positions
- Can create exit conditions from this view

## Recommended: Hybrid Approach
1. **Terminal**: Support both entry and exit commands
2. **CatalystReveal**: Add "Positions" tab showing active positions
3. **Position Cards**: Show exit conditions, allow editing

## UI Changes Needed

### Terminal:
- Add position management examples
- Support commands like "Close", "Reverse", "Cancel"
- Show active positions list in sidebar

### CatalystReveal:
- Add "Positions" tab (3rd tab: Monitoring | Backtest | Positions)
- Show active positions with exit conditions
- Allow creating new exit conditions

### Strategy Parser:
- Detect position management commands
- Parse exit conditions (similar to entry conditions)
- Link to existing position ID

