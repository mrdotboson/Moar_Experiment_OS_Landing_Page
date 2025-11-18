# Scalable UI/UX Strategy for Multi-Strategy Platform

## Executive Summary

To scale from event-aware trading to a comprehensive automation platform supporting funding rate farming, technical analysis, and other strategies, we need to build a **strategy-agnostic architecture** with **progressive disclosure** and **modular condition systems**.

---

## 1. Strategy Type Selection Layer

### Current Problem
- UI is hardcoded to "event-aware" terminology
- Builder assumes Polymarket events are primary
- No clear entry point for different strategy types

### Solution: Strategy Type Selector

**Add a strategy type selection step before the builder:**

```
┌─────────────────────────────────────┐
│  What type of strategy?              │
├─────────────────────────────────────┤
│  [Event-Driven]  [Funding Rate]     │
│  [Technical]    [Arbitrage]         │
│  [Custom]                           │
└─────────────────────────────────────┘
```

**Implementation:**
- Add `strategyType` state: `'event-driven' | 'funding-rate' | 'technical' | 'arbitrage' | 'custom'`
- Show this selector when opening position modal or creating new strategy
- Each type loads appropriate condition templates and UI adaptations

**Benefits:**
- Clear mental model for users
- Allows progressive disclosure (only show relevant options)
- Makes platform feel comprehensive, not just event-focused

---

## 2. Modular Condition System Architecture

### Current Problem
- Conditions are hardcoded in builder UI
- Adding new condition types requires UI changes
- No clear separation between condition types and their UI

### Solution: Condition Registry Pattern

**Create a condition registry:**

```typescript
interface ConditionDefinition {
  id: string
  name: string
  category: 'event' | 'market' | 'technical' | 'risk'
  inputType: 'number' | 'text' | 'select' | 'date' | 'market-select'
  validation?: (value: any) => boolean
  formatCommand: (value: any) => string
  uiComponent?: React.ComponentType<ConditionInputProps>
  availableForStrategies: StrategyType[]
}

const CONDITION_REGISTRY: ConditionDefinition[] = [
  {
    id: 'polymarket-probability',
    name: 'Polymarket Event Probability',
    category: 'event',
    availableForStrategies: ['event-driven', 'hybrid'],
    // ...
  },
  {
    id: 'funding-rate',
    name: 'Funding Rate',
    category: 'market',
    availableForStrategies: ['funding-rate', 'hybrid', 'custom'],
    // ...
  },
  {
    id: 'price-level',
    name: 'Price Level',
    category: 'technical',
    availableForStrategies: ['technical', 'hybrid', 'custom'],
    // ...
  }
]
```

**Benefits:**
- New conditions can be added without UI changes
- Conditions automatically appear/disappear based on strategy type
- Consistent validation and formatting
- Easy to A/B test different UI components

---

## 3. Unified Builder Architecture

### Current Problem
- Builder is event-specific
- Hard to extend for other strategy types
- Duplicated logic between quick actions and builder

### Solution: Strategy-Aware Builder

**Refactor builder to be strategy-agnostic:**

```typescript
interface BuilderConfig {
  strategyType: StrategyType
  primaryConditions: ConditionDefinition[]  // Required conditions
  optionalConditions: ConditionDefinition[] // Optional conditions
  actionTypes: ActionType[]                 // Available actions
  templates: StrategyTemplate[]              // Pre-built templates
}

// Builder dynamically loads config based on strategy type
const builderConfig = getBuilderConfig(selectedStrategyType)
```

**Builder Structure:**
1. **Strategy Type Selector** (if not pre-selected)
2. **Action Selection** (Close, Reverse, etc.) - same for all types
3. **Primary Conditions** (varies by type)
   - Event-driven: Polymarket event + probability
   - Funding rate: Funding rate threshold + direction
   - Technical: Price/indicator + threshold
4. **Additional Conditions** (same pool, filtered by strategy type)
5. **Risk Parameters** (same for all)

**Benefits:**
- Single builder codebase for all strategy types
- Easy to add new strategy types
- Consistent UX across strategy types

---

## 4. Progressive Disclosure & Contextual UI

### Current Problem
- All options shown at once (overwhelming)
- Event-specific UI elements shown even for non-event strategies

### Solution: Context-Aware UI Rendering

**Use the existing `getUIAdaptations` pattern but expand it:**

```typescript
interface UIAdaptations {
  // Header/title
  primaryLabel: string
  secondaryLabel?: string
  
  // Condition sections
  showPrimaryConditions: boolean
  showSecondaryConditions: boolean
  showRiskParameters: boolean
  
  // Monitoring panels (for reveal view)
  emphasizedPanels: string[]
  hiddenPanels: string[]
  
  // Examples/templates
  exampleStrategies: string[]
  
  // Help text
  contextualHelp: string
}

function getUIAdaptations(strategyType: StrategyType): UIAdaptations {
  switch (strategyType) {
    case 'event-driven':
      return {
        primaryLabel: 'Event-Aware Automation',
        showPrimaryConditions: true,
        emphasizedPanels: ['event-status', 'probability-tracker'],
        // ...
      }
    case 'funding-rate':
      return {
        primaryLabel: 'Funding Rate Strategy',
        showPrimaryConditions: true,
        emphasizedPanels: ['funding-rate-monitor', 'position-tracker'],
        // ...
      }
  }
}
```

**Benefits:**
- Cleaner, less overwhelming UI
- Users only see what's relevant
- Easy to customize per strategy type

---

## 5. Template/Pattern Library

### Current Problem
- Examples are hardcoded in Terminal
- No way to browse strategy patterns
- Examples are event-focused

### Solution: Strategy Template System

**Create a template library organized by strategy type:**

```typescript
interface StrategyTemplate {
  id: string
  name: string
  description: string
  strategyType: StrategyType
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  command: string
  tags: string[]
  preview: {
    expectedReturn?: string
    riskLevel?: string
    timeHorizon?: string
  }
}

const TEMPLATES: StrategyTemplate[] = [
  {
    id: 'funding-rate-farm',
    name: 'Funding Rate Farming',
    strategyType: 'funding-rate',
    command: 'Long ETH when funding rate below -0.01% and close when funding rate above 0.01%',
    // ...
  },
  {
    id: 'event-take-profit',
    name: 'Event Take Profit',
    strategyType: 'event-driven',
    command: 'Close SOL long position if Polymarket "Event" probability ≥ 75%',
    // ...
  }
]
```

**UI:**
- Add "Browse Templates" button in Terminal
- Filter templates by strategy type
- Show templates in position modal builder
- Allow one-click template application

**Benefits:**
- Users discover new strategy types
- Reduces learning curve
- Encourages experimentation

---

## 6. Terminology Evolution

### Current Problem
- "Event-Aware" is too specific
- Hard to rebrand when adding new strategy types

### Solution: Hierarchical Terminology

**Use generic terms at top level, specific at detail level:**

```
┌─────────────────────────────────────┐
│  Strategy Builder                   │  ← Generic
├─────────────────────────────────────┤
│  Type: Event-Driven Automation      │  ← Specific
│  └─ Polymarket Event Probability    │  ← Very Specific
└─────────────────────────────────────┘
```

**Terminology Map:**
- **Top Level:** "Strategy", "Automation", "Conditional Order"
- **Strategy Type:** "Event-Driven", "Funding Rate", "Technical Analysis"
- **Condition Level:** "Polymarket Event", "Funding Rate Threshold", "Price Level"

**Benefits:**
- Platform feels comprehensive
- Easy to add new types without rebranding
- Clear hierarchy for users

---

## 7. Navigation & Organization

### Current Problem
- No clear way to switch between strategy types
- All strategies feel the same in the UI

### Solution: Strategy Type Tabs/Pills

**Add strategy type indicators:**

1. **In Terminal:**
   - Add strategy type pills above input
   - Filter examples by selected type
   - Show relevant quick actions

2. **In Position Modal:**
   - Show strategy type badge
   - Group automations by type
   - Allow filtering by type

3. **In Catalyst Reveal:**
   - Show strategy type in position cards
   - Group positions by strategy type
   - Type-specific monitoring panels

**Benefits:**
- Clear organization
- Easy to find specific strategy types
- Scalable as you add more types

---

## 8. Condition Composition System

### Current Problem
- Conditions are added sequentially
- No clear logic operators (AND/OR)
- Hard to build complex strategies

### Solution: Visual Condition Builder

**Add a condition composition UI:**

```
┌─────────────────────────────────────┐
│  Conditions:                        │
│  ┌───────────────────────────────┐ │
│  │ [Polymarket Event ≥ 75%]  AND  │ │
│  │ [Price above $3500]       AND  │ │
│  │ [Funding Rate below -0.01%]   │ │
│  └───────────────────────────────┘ │
│  [+ Add Condition] [Change Logic]    │
└─────────────────────────────────────┘
```

**Features:**
- Drag to reorder conditions
- Click to change AND/OR logic
- Visual grouping for complex conditions
- Preview command updates in real-time

**Benefits:**
- Supports complex strategies
- Clear visual representation
- Reduces errors in condition logic

---

## 9. Strategy Type-Specific Monitoring

### Current Problem
- Monitoring panels are event-focused
- Hard to monitor funding rate strategies
- No type-specific metrics

### Solution: Panel Registry System

**Extend existing panel system:**

```typescript
interface MonitoringPanel {
  id: string
  name: string
  strategyTypes: StrategyType[]
  component: React.ComponentType<PanelProps>
  priority: number  // For ordering
}

const PANEL_REGISTRY: MonitoringPanel[] = [
  {
    id: 'event-status',
    name: 'Event Status',
    strategyTypes: ['event-driven', 'hybrid'],
    component: EventStatusPanel,
    priority: 1
  },
  {
    id: 'funding-rate-monitor',
    name: 'Funding Rate Monitor',
    strategyTypes: ['funding-rate', 'hybrid'],
    component: FundingRateMonitorPanel,
    priority: 1
  },
  {
    id: 'position-tracker',
    name: 'Position Tracker',
    strategyTypes: ['*'],  // All types
    component: PositionTrackerPanel,
    priority: 2
  }
]
```

**Benefits:**
- Panels automatically show/hide based on strategy type
- Easy to add new monitoring panels
- Consistent panel system across strategy types

---

## 10. Migration Path

### Phase 1: Foundation (Current → Month 1)
1. ✅ Add strategy type selector to position modal
2. ✅ Create condition registry structure
3. ✅ Refactor builder to use strategy type config
4. ✅ Update terminology to be more generic

### Phase 2: Funding Rate Support (Month 2)
1. Add funding rate condition definitions
2. Create funding rate strategy templates
3. Add funding rate monitoring panel
4. Update examples to include funding rate strategies

### Phase 3: Technical Analysis (Month 3)
1. Add technical indicator conditions
2. Create technical strategy templates
3. Add chart/indicator monitoring panels
4. Integrate with charting libraries

### Phase 4: Advanced Features (Month 4+)
1. Visual condition builder
2. Strategy composition (multiple strategies)
3. Backtesting for all strategy types
4. Strategy marketplace/templates

---

## Implementation Priority

### High Priority (Do First)
1. **Strategy Type Selector** - Foundation for everything else
2. **Condition Registry** - Enables modular conditions
3. **Unified Builder Architecture** - Single codebase for all types
4. **Terminology Updates** - Make platform feel comprehensive

### Medium Priority (Do Second)
1. **Template System** - Helps users discover new types
2. **Progressive Disclosure** - Improves UX significantly
3. **Panel Registry** - Enables type-specific monitoring

### Low Priority (Do Later)
1. **Visual Condition Builder** - Nice to have, complex
2. **Strategy Composition** - Advanced feature
3. **Backtesting** - Can be added incrementally

---

## Key Principles

1. **Strategy-Agnostic Core:** Core builder/parser should work for any strategy type
2. **Progressive Disclosure:** Show only what's relevant to current strategy type
3. **Modular Architecture:** Conditions, panels, templates as pluggable modules
4. **Consistent Patterns:** Same UX patterns across all strategy types
5. **Extensibility:** Easy to add new strategy types without major refactoring

---

## Example: Funding Rate Strategy Flow

```
1. User opens position modal
2. Sees strategy type selector → selects "Funding Rate"
3. Builder loads funding rate config:
   - Primary: Funding rate threshold
   - Optional: Price, OI, time-based
4. User configures:
   - Action: Long ETH
   - Condition: Funding rate below -0.01%
   - Additional: Price above $3000
5. Command generated: "Long ETH if funding rate below -0.01% and price above $3000"
6. In Catalyst Reveal:
   - Shows funding rate monitor panel
   - Shows position tracker
   - Hides event status panel
```

This flow uses the same builder architecture but with different conditions and monitoring panels.

---

## Conclusion

The key to scalability is **abstraction** and **modularity**. By building a strategy-agnostic core with pluggable condition types, monitoring panels, and templates, you can add new strategy types without major refactoring. The UI adapts automatically based on strategy type, keeping the experience clean and focused.

