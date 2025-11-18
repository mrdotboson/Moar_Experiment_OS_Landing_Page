# IFTTT Command Builder Integration Guide

## Overview

This guide shows how to integrate the IFTTT-style text command interface into your existing app. The component is designed to match your current patterns and can be tested in isolation before integration.

## Files Created

1. **`components/IFTTTCommandBuilder.tsx`** - Main component (matches your Terminal.tsx patterns)
2. **`components/IFTTTCommandBuilderDemo.tsx`** - Standalone demo component
3. **`app/ifttt-demo/page.tsx`** - Demo page route

## Testing the Component

### Option 1: Demo Page (Recommended)
1. Start your Next.js dev server: `npm run dev`
2. Navigate to: `http://localhost:3000/ifttt-demo`
3. Test the component in isolation

### Option 2: Import in Existing Component
```tsx
import IFTTTCommandBuilder from '@/components/IFTTTCommandBuilder'

// Use in your component
<IFTTTCommandBuilder 
  onSubmit={(command) => {
    // Your existing handler
    handleInputSubmit(command)
  }}
/>
```

## Integration Options

### Option A: Replace Current Input (Full Integration)

Replace the current input in `Terminal.tsx`:

```tsx
// In Terminal.tsx, replace the input section with:
<IFTTTCommandBuilder 
  onSubmit={onSubmit}
  initialValue={userInput}
  placeholder="Polymarket 'BTC ETF Approval' probability ≥ 75% then close position"
/>
```

### Option B: Add as Alternative Mode (Hybrid)

Add a toggle to switch between modes:

```tsx
const [useIFTTTMode, setUseIFTTTMode] = useState(false)

{useIFTTTMode ? (
  <IFTTTCommandBuilder onSubmit={onSubmit} />
) : (
  // Your existing input
  <input ... />
)}
```

### Option C: Use in Position Modal (Recommended First Step)

Add to position management modal as an alternative to the builder:

```tsx
// In position modal
<div className="mb-4">
  <button onClick={() => setShowIFTTTBuilder(!showIFTTTBuilder)}>
    {showIFTTTBuilder ? 'Use Builder' : 'Use Text Command'}
  </button>
  
  {showIFTTTBuilder ? (
    <IFTTTCommandBuilder 
      onSubmit={(command) => {
        setInput(command)
        setShowPositionModal(false)
      }}
    />
  ) : (
    // Existing builder
  )}
</div>
```

## Component Props

```tsx
interface IFTTTCommandBuilderProps {
  onSubmit: (command: string) => void  // Required - called when user submits
  initialValue?: string                // Optional - pre-fill input
  placeholder?: string                 // Optional - placeholder text
}
```

## Features

✅ **Autocomplete** - Context-aware suggestions (triggers → actions)
✅ **Keyboard Navigation** - Arrow keys, Tab, Enter, Escape
✅ **Syntax Highlighting** - Real-time preview with colors
✅ **Validation** - Shows valid/invalid status
✅ **Quick Examples** - Click to fill examples
✅ **Matches Your Patterns** - Uses same hooks, styling, patterns

## Styling

The component uses your existing Tailwind classes:
- `bloomberg-bg`, `bloomberg-panel`, `bloomberg-text`, etc.
- `border-terminal` for borders
- `text-[#8B5CF6]` for purple accents
- Matches your Terminal.tsx styling patterns

## Customization

### Add More Autocomplete Options

Edit `AUTCOMPLETE_OPTIONS` in `IFTTTCommandBuilder.tsx`:

```tsx
triggers: [
  { title: 'Your Trigger', desc: 'Description', syntax: 'syntax here', category: 'trigger' },
  // ...
]
```

### Customize Preview Formatting

Modify the `formatPreview` function:

```tsx
const formatPreview = useCallback((text: string) => {
  // Your custom formatting
}, [])
```

### Add Custom Validation

Modify the `isValidCommand` function:

```tsx
const isValidCommand = useCallback((value: string) => {
  // Your validation logic
}, [])
```

## Next Steps

1. **Test the demo page** - Verify it works as expected
2. **Try in position modal** - Add as alternative to builder (Option C)
3. **Gather feedback** - See how users respond
4. **Full integration** - Replace main input if successful (Option A)

## Notes

- Component is fully isolated - no changes to existing files
- Can be removed easily if not needed
- Matches your code patterns exactly
- TypeScript typed for safety
- Uses your existing styling system

