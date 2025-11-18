# Visual Condition List Mockup

## Current State vs Proposed Design

---

## Current Builder (Form-Based)

```
┌─────────────────────────────────────────────────────┐
│  Add Conditional Automation                          │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Action: [Close] [Reverse] [Increase] [Reduce]    │
│                                                      │
│  Event: [Search events...]                         │
│  Probability: [75] %                                │
│                                                      │
│  Additional Conditions:                             │
│  [▶] Price Condition                                │
│  [▶] Open Interest Condition                        │
│  [▶] Funding Rate Condition                         │
│                                                      │
│  [Create Event-Aware Automation]                    │
└─────────────────────────────────────────────────────┘
```

**Problem:** Can't see all conditions at once, hard to understand logic flow.

---

## Proposed: Visual Condition List

### Simple Strategy (2-3 conditions)

```
┌─────────────────────────────────────────────────────┐
│  Add Conditional Automation                          │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Action: [● Close] [ ] Reverse [ ] Increase [ ] Reduce│
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │ Active Conditions                             │  │
│  ├──────────────────────────────────────────────┤  │
│  │                                               │  │
│  │ ① Polymarket "BTC ETF Approval"              │  │
│  │    probability ≥ 75%                         │  │
│  │    ┌────────────────────────────────────┐   │  │
│  │    │ [↑] [↓] [×] [Edit] [AND ▼]        │   │  │
│  │    └────────────────────────────────────┘   │  │
│  │                                               │  │
│  │ ② Price above $45,000                        │  │
│  │    ┌────────────────────────────────────┐   │  │
│  │    │ [↑] [↓] [×] [Edit] [AND ▼]        │   │  │
│  │    └────────────────────────────────────┘   │  │
│  │                                               │  │
│  │ ③ Funding Rate below -0.01%                 │  │
│  │    ┌────────────────────────────────────┐   │  │
│  │    │ [↑] [↓] [×] [Edit] [OR ▼]         │   │  │
│  │    └────────────────────────────────────┘   │  │
│  │                                               │  │
│  │ [+ Add Condition]                            │  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
│  Preview:                                            │
│  Close SOL long position if                         │
│  Polymarket "BTC ETF Approval" probability ≥ 75%   │
│  AND price above $45,000                           │
│  AND funding rate below -0.01%                      │
│                                                      │
│  [Create Automation]                                │
└─────────────────────────────────────────────────────┘
```

---

## Detailed Component Breakdown

### Condition Card Design

```
┌─────────────────────────────────────────────────────┐
│  ① Polymarket "BTC ETF Approval"                    │
│     probability ≥ 75%                                 │
│  ┌──────────────────────────────────────────────┐  │
│  │ [↑] Move Up  [↓] Move Down  [×] Remove       │  │
│  │ [Edit] Configure  [AND ▼] Change Logic        │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

**Visual Elements:**
- **Number badge** (①, ②, ③) - Shows order
- **Condition description** - Clear, readable text
- **Action buttons** - Compact, terminal-style
- **Logic indicator** - Shows AND/OR between conditions

---

## Complex Strategy with Groups

```
┌─────────────────────────────────────────────────────┐
│  Active Conditions                                   │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌─ Group 1 ────────────────────────────────────┐ │
│  │                                               │ │
│  │  ① Polymarket "BTC ETF Approval"            │ │
│  │     probability ≥ 75%                        │ │
│  │     [↑] [↓] [×] [Edit] [AND ▼]              │ │
│  │                                               │ │
│  │  ② Price above $45,000                       │ │
│  │     [↑] [↓] [×] [Edit] [AND ▼]               │ │
│  │                                               │ │
│  └───────────────────────────────────────────────┘ │
│         │                                           │
│         │ AND                                       │
│         ▼                                           │
│  ┌─ Group 2 ────────────────────────────────────┐ │
│  │                                               │ │
│  │  ③ Funding Rate below -0.01%                │ │
│  │     [↑] [↓] [×] [Edit] [OR ▼]               │ │
│  │                                               │ │
│  │  ④ Open Interest rises 5% over 24h           │ │
│  │     [↑] [↓] [×] [Edit] [OR ▼]               │ │
│  │                                               │ │
│  └───────────────────────────────────────────────┘ │
│                                                      │
│  Logic: (Group 1) AND (Group 2)                     │
│                                                      │
│  [+ Add Condition]  [+ Create Group]                │
└─────────────────────────────────────────────────────┘
```

---

## Interactive States

### Hover State

```
┌─────────────────────────────────────────────────────┐
│  ① Polymarket "BTC ETF Approval"                    │
│     probability ≥ 75%                               │
│  ┌──────────────────────────────────────────────┐  │
│  │ [↑] [↓] [×] [Edit] [AND ▼]                   │  │
│  └──────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────┐  │
│  │ Hover: Border highlights in purple            │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### Editing State

```
┌─────────────────────────────────────────────────────┐
│  ① Polymarket "BTC ETF Approval"                    │
│     probability ≥ 75%                               │
│  ┌──────────────────────────────────────────────┐  │
│  │ [↑] [↓] [×] [● Editing] [AND ▼]             │  │
│  └──────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────┐  │
│  │ Event: [BTC ETF Approval ▼]                  │  │
│  │ Probability: [75] %                          │  │
│  │ [Save] [Cancel]                              │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### Logic Toggle Dropdown

```
┌─────────────────────────────────────────────────────┐
│  ① Polymarket "BTC ETF Approval"                    │
│     probability ≥ 75%                               │
│  ┌──────────────────────────────────────────────┐  │
│  │ [↑] [↓] [×] [Edit] [AND ▼]                  │  │
│  │                    ┌──────────────────────┐  │  │
│  │                    │ ● AND                │  │  │
│  │                    │   OR                 │  │  │
│  │                    └──────────────────────┘  │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

---

## Color Coding & Visual Hierarchy

### Condition Types

```
┌─────────────────────────────────────────────────────┐
│  Event Conditions (Purple border)                    │
│  ┌──────────────────────────────────────────────┐  │
│  │ ① Polymarket "Event" probability ≥ 75%      │  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
│  Market Conditions (Blue border)                      │
│  ┌──────────────────────────────────────────────┐  │
│  │ ② Price above $45,000                       │  │
│  │ ③ Funding Rate below -0.01%                 │  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
│  Technical Conditions (Orange border)                │
│  ┌──────────────────────────────────────────────┐  │
│  │ ④ RSI above 70                              │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

---

## Compact View (For Many Conditions)

```
┌─────────────────────────────────────────────────────┐
│  Active Conditions (5)                              │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ① Event ≥ 75%  AND  ② Price > $45K  AND          │
│  ③ Funding < -0.01%  OR  ④ OI ↑ 5%  AND          │
│  ⑤ Volume > $100M                                    │
│                                                      │
│  [Expand] [Reorder] [Edit Logic]                    │
└─────────────────────────────────────────────────────┘
```

**Expanded View:**
```
┌─────────────────────────────────────────────────────┐
│  Active Conditions (5)                              │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ① Polymarket "BTC ETF Approval"                    │
│     probability ≥ 75%                               │
│     [↑] [↓] [×] [Edit] [AND ▼]                     │
│                                                      │
│  ② Price above $45,000                              │
│     [↑] [↓] [×] [Edit] [AND ▼]                     │
│                                                      │
│  ③ Funding Rate below -0.01%                       │
│     [↑] [↓] [×] [Edit] [OR ▼]                      │
│                                                      │
│  ④ Open Interest rises 5% over 24h                 │
│     [↑] [↓] [×] [Edit] [AND ▼]                     │
│                                                      │
│  ⑤ Volume above $100M                               │
│     [↑] [↓] [×] [Edit]                              │
│                                                      │
│  [Collapse]                                          │
└─────────────────────────────────────────────────────┘
```

---

## Integration with Current Builder

### Step 1: Add Condition (Form-Based)

```
┌─────────────────────────────────────────────────────┐
│  [+ Add Condition]                                  │
│  ┌──────────────────────────────────────────────┐  │
│  │ Condition Type: [Price Condition ▼]          │  │
│  │ Direction: [Above ▼]                          │  │
│  │ Value: [$45,000]                              │  │
│  │ [Add] [Cancel]                                │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### Step 2: Condition Appears in List

```
┌─────────────────────────────────────────────────────┐
│  Active Conditions                                   │
│                                                      │
│  ① Price above $45,000                              │
│     [↑] [↓] [×] [Edit] [AND ▼]                     │
│                                                      │
│  [+ Add Condition]                                   │
└─────────────────────────────────────────────────────┘
```

---

## Mobile/Responsive View

```
┌─────────────────────────────────────┐
│  Conditions (3)                     │
├─────────────────────────────────────┤
│                                      │
│  ┌──────────────────────────────┐  │
│  │ ① Event ≥ 75%                │  │
│  │ [↑↓] [×] [Edit] [AND ▼]    │  │
│  └──────────────────────────────┘  │
│                                      │
│  ┌──────────────────────────────┐  │
│  │ ② Price > $45K               │  │
│  │ [↑↓] [×] [Edit] [AND ▼]    │  │
│  └──────────────────────────────┘  │
│                                      │
│  ┌──────────────────────────────┐  │
│  │ ③ Funding < -0.01%           │  │
│  │ [↑↓] [×] [Edit]              │  │
│  └──────────────────────────────┘  │
│                                      │
│  [+ Add]                             │
└─────────────────────────────────────┘
```

---

## Real-Time Preview Integration

```
┌─────────────────────────────────────────────────────┐
│  Active Conditions                                   │
│                                                      │
│  ① Polymarket "BTC ETF Approval"                    │
│     probability ≥ 75%                               │
│     [↑] [↓] [×] [Edit] [AND ▼]                     │
│                                                      │
│  ② Price above $45,000                              │
│     [↑] [↓] [×] [Edit] [AND ▼]                     │
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │ Preview (Updates in Real-Time):              │  │
│  │                                              │  │
│  │ Close SOL long position if                  │  │
│  │ Polymarket "BTC ETF Approval"               │  │
│  │ probability ≥ 75%                           │  │
│  │ AND price above $45,000                     │  │
│  │                                              │  │
│  │ [Copy Command]                               │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

---

## Keyboard Shortcuts

```
┌─────────────────────────────────────────────────────┐
│  Active Conditions                                   │
│                                                      │
│  ① Polymarket "BTC ETF Approval"                    │
│     probability ≥ 75%                               │
│     [↑] [↓] [×] [Edit] [AND ▼]                     │
│                                                      │
│  Keyboard Shortcuts:                                │
│  • ↑/↓ Arrow Keys: Reorder conditions               │
│  • Tab: Navigate between conditions                 │
│  • Enter: Edit condition                            │
│  • Delete: Remove condition                        │
│  • A/O: Toggle AND/OR logic                        │
└─────────────────────────────────────────────────────┘
```

---

## Animation & Transitions

### Reordering Animation

```
Before:
  ① Condition A
  ② Condition B
  ③ Condition C

During Drag/Reorder:
  ① Condition A
  ③ Condition C  ← Highlighted, moving
  ② Condition B  ← Faded, placeholder

After:
  ① Condition A
  ② Condition C  ← Smoothly moved
  ③ Condition B
```

### Logic Change Animation

```
Before:  Condition A AND Condition B
         └─ AND indicator

After:   Condition A OR Condition B
         └─ OR indicator (smooth color transition)
```

---

## Accessibility Features

```
┌─────────────────────────────────────────────────────┐
│  Active Conditions                                   │
│                                                      │
│  ① Polymarket "BTC ETF Approval"                    │
│     probability ≥ 75%                               │
│     ┌──────────────────────────────────────────┐   │
│     │ [↑ Move Up] [↓ Move Down] [× Remove]    │   │
│     │ [Edit] [AND - Change to OR ▼]            │   │
│     └──────────────────────────────────────────┘   │
│                                                      │
│  Screen Reader:                                     │
│  "Condition 1 of 3: Polymarket BTC ETF Approval    │
│   probability greater than or equal to 75 percent.  │
│   Connected with AND to next condition."            │
└─────────────────────────────────────────────────────┘
```

---

## Summary

**Key Visual Elements:**
1. **Numbered badges** (①, ②, ③) - Clear ordering
2. **Condition cards** - Dense, terminal-style
3. **Action buttons** - Compact, always visible
4. **Logic indicators** - Clear AND/OR between conditions
5. **Color coding** - Different colors for condition types
6. **Real-time preview** - Shows command as you build
7. **Keyboard shortcuts** - Maintains terminal aesthetic

**Benefits:**
- ✅ See all conditions at once
- ✅ Understand logic flow visually
- ✅ Easy to reorder and modify
- ✅ Maintains terminal aesthetic
- ✅ Keyboard accessible
- ✅ Mobile friendly

