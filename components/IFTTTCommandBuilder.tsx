'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface IFTTTCommandBuilderProps {
  onSubmit: (command: string) => void
  initialValue?: string
  placeholder?: string
}

interface AutocompleteOption {
  title: string
  desc: string
  syntax: string
  category: 'trigger' | 'action' | 'logic'
}

const AUTCOMPLETE_OPTIONS: Record<string, AutocompleteOption[]> = {
  triggers: [
    { title: 'Polymarket Event', desc: 'Monitor event probability', syntax: "Polymarket 'Event Name' probability ≥ X%", category: 'trigger' },
    { title: 'Price Level', desc: 'Monitor price threshold', syntax: 'price above/below $X', category: 'trigger' },
    { title: 'Funding Rate', desc: 'Monitor funding rate', syntax: 'funding rate above/below X%', category: 'trigger' },
    { title: 'Open Interest', desc: 'Monitor OI changes', syntax: 'open interest rises/falls X% over Yh', category: 'trigger' },
    { title: 'Volume', desc: 'Monitor trading volume', syntax: 'volume above/below $X', category: 'trigger' },
    { title: 'Time-Based', desc: 'Schedule trigger', syntax: 'at time HH:MM', category: 'trigger' },
  ],
  actions: [
    { title: 'Close Position', desc: 'Exit existing position', syntax: 'close position [ID] [%]', category: 'action' },
    { title: 'Open Position', desc: 'Enter new position', syntax: 'long/short ASSET with Xx leverage', category: 'action' },
    { title: 'Modify Position', desc: 'Adjust position size', syntax: 'increase/decrease position by X%', category: 'action' },
    { title: 'Set Stop Loss', desc: 'Add stop loss', syntax: 'set stop loss at $X', category: 'action' },
    { title: 'Reverse Position', desc: 'Flip direction', syntax: 'reverse position', category: 'action' },
  ],
  logic: [
    { title: 'AND', desc: 'All conditions must be true', syntax: 'and', category: 'logic' },
    { title: 'OR', desc: 'Any condition can be true', syntax: 'or', category: 'logic' },
  ],
}

const QUICK_EXAMPLES = [
  "If Polymarket 'BTC ETF Approval' probability ≥ 75% then close SOL long position",
  "If funding rate below -0.01% then long ETH with 4x leverage",
  "If price above $45,000 and open interest rises 5% over 24h then increase position by 25%",
  "If Polymarket 'Event' probability ≥ 70% and price above $40,000 and funding rate below 0% then close 50% of position"
]

export default function IFTTTCommandBuilder({ 
  onSubmit, 
  initialValue = '',
  placeholder = "Polymarket 'BTC ETF Approval' probability ≥ 75% and price above $45,000 then close SOL long position"
}: IFTTTCommandBuilderProps) {
  const [input, setInput] = useState(initialValue)
  const [autocompleteVisible, setAutocompleteVisible] = useState(false)
  const [autocompleteOptions, setAutocompleteOptions] = useState<AutocompleteOption[]>([])
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [currentCategory, setCurrentCategory] = useState<'triggers' | 'actions'>('triggers')
  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<HTMLDivElement>(null)

  // Determine if we're in the "then" part of the command
  const hasThen = useCallback((value: string) => {
    return value.toLowerCase().includes('then')
  }, [])

  // Get autocomplete options based on current input
  const getAutocompleteOptions = useCallback((value: string) => {
    if (!value.trim()) {
      return AUTCOMPLETE_OPTIONS.triggers
    }

    const words = value.split(' ')
    const lastWord = words[words.length - 1].toLowerCase()
    const inThenSection = hasThen(value)
    
    let category: 'triggers' | 'actions' = inThenSection ? 'actions' : 'triggers'
    setCurrentCategory(category)

    let options = AUTCOMPLETE_OPTIONS[category]

    // If we have conditions and not in "then" section, also show logic operators
    if (!inThenSection && words.length > 2) {
      options = [...options, ...AUTCOMPLETE_OPTIONS.logic]
    }

    // Filter by last word if it exists
    if (lastWord && lastWord.length > 0) {
      options = options.filter(opt => 
        opt.title.toLowerCase().includes(lastWord) ||
        opt.syntax.toLowerCase().includes(lastWord) ||
        opt.desc.toLowerCase().includes(lastWord)
      )
    }

    return options
  }, [hasThen])

  // Handle input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInput(value)
    
    // Update autocomplete
    const options = getAutocompleteOptions(value)
    setAutocompleteOptions(options)
    setAutocompleteVisible(options.length > 0 && value.trim().length > 0)
    setSelectedIndex(-1)
  }, [getAutocompleteOptions])

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!autocompleteVisible || autocompleteOptions.length === 0) {
      if (e.key === 'Enter' && input.trim()) {
        e.preventDefault()
        onSubmit(input.trim())
        setInput('')
        setAutocompleteVisible(false)
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => Math.min(prev + 1, autocompleteOptions.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => Math.max(prev - 1, -1))
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0) {
          selectAutocompleteOption(autocompleteOptions[selectedIndex])
        } else if (input.trim()) {
          onSubmit(input.trim())
          setInput('')
          setAutocompleteVisible(false)
        }
        break
      case 'Tab':
        if (selectedIndex >= 0 || autocompleteOptions.length > 0) {
          e.preventDefault()
          const index = selectedIndex >= 0 ? selectedIndex : 0
          selectAutocompleteOption(autocompleteOptions[index])
        }
        break
      case 'Escape':
        setAutocompleteVisible(false)
        setSelectedIndex(-1)
        break
    }
  }, [autocompleteVisible, autocompleteOptions, selectedIndex, input, onSubmit])

  // Select an autocomplete option
  const selectAutocompleteOption = useCallback((option: AutocompleteOption) => {
    const currentValue = input
    const words = currentValue.split(' ')
    
    // Replace last word with first word of syntax
    if (words.length > 0) {
      const syntaxWords = option.syntax.split(' ')
      words[words.length - 1] = syntaxWords[0]
    }
    
    const newValue = words.join(' ') + ' '
    setInput(newValue)
    setAutocompleteVisible(false)
    setSelectedIndex(-1)
    inputRef.current?.focus()
  }, [input])

  // Handle input focus
  const handleFocus = useCallback(() => {
    if (input.trim()) {
      const options = getAutocompleteOptions(input)
      setAutocompleteOptions(options)
      setAutocompleteVisible(options.length > 0)
    }
  }, [input, getAutocompleteOptions])

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        autocompleteRef.current &&
        !autocompleteRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setAutocompleteVisible(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Fill example
  const fillExample = useCallback((example: string) => {
    setInput(example)
    inputRef.current?.focus()
    const options = getAutocompleteOptions(example)
    setAutocompleteOptions(options)
  }, [getAutocompleteOptions])

  // Format preview text with syntax highlighting
  const formatPreview = useCallback((text: string) => {
    return text
      .replace(/\bif\b/gi, '<span class="text-[#8B5CF6] font-bold">if</span>')
      .replace(/\bthen\b/gi, '<span class="text-[#FFAA00] font-bold">then</span>')
      .replace(/\band\b/gi, '<span class="text-bloomberg-text-dim italic">and</span>')
      .replace(/\bor\b/gi, '<span class="text-bloomberg-text-dim italic">or</span>')
      .replace(/(\d+%)/g, '<span class="text-bloomberg-green">$1</span>')
      .replace(/(\$[\d,]+)/g, '<span class="text-bloomberg-green">$1</span>')
      .replace(/(probability|price|funding|open interest|volume)/gi, '<span class="text-[#8B5CF6]">$1</span>')
  }, [])

  // Check if command is valid
  const isValidCommand = useCallback((value: string) => {
    const hasIf = value.toLowerCase().includes('if')
    const hasThen = value.toLowerCase().includes('then')
    const hasCondition = value.split(' ').length > 2
    return hasIf && hasThen && hasCondition
  }, [])

  return (
    <div className="w-full">
      {/* Command Input */}
      <div className="relative mb-4">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-[#8B5CF6] text-sm font-bold">If</span>
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={handleFocus}
              placeholder={placeholder}
              className="w-full bg-bloomberg-bg border-2 border-terminal px-4 py-3 text-bloomberg-text text-sm font-mono outline-none focus:border-[#8B5CF6] focus:shadow-[0_0_20px_rgba(139,92,246,0.2)] transition-all"
              autoComplete="off"
              spellCheck="false"
            />
            
            {/* Autocomplete Dropdown */}
            {autocompleteVisible && autocompleteOptions.length > 0 && (
              <div
                ref={autocompleteRef}
                className="absolute top-full left-0 right-0 mt-1 bg-bloomberg-bg border border-terminal rounded-b-lg max-h-64 overflow-y-auto z-50 shadow-lg"
              >
                <div className="text-[#8B5CF6] text-[10px] uppercase tracking-wider font-bold px-4 py-2 bg-bloomberg-panel border-b border-terminal">
                  {currentCategory.toUpperCase()}
                </div>
                {autocompleteOptions.map((option, index) => (
                  <div
                    key={index}
                    onClick={() => selectAutocompleteOption(option)}
                    className={`px-4 py-3 cursor-pointer transition-all border-b border-terminal last:border-b-0 ${
                      index === selectedIndex
                        ? 'bg-[#8B5CF6]/20 border-l-2 border-l-[#8B5CF6]'
                        : 'hover:bg-bloomberg-panel hover:border-l-2 hover:border-l-[#8B5CF6]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="text-bloomberg-text text-xs font-bold mb-1">
                          {option.title}
                        </div>
                        <div className="text-bloomberg-text-dim text-[10px]">
                          {option.desc}
                        </div>
                      </div>
                      <div className="text-[#8B5CF6] text-[10px] font-mono">
                        {option.syntax}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Syntax Hint */}
        <div className="ml-12 mt-2 px-3 py-2 bg-[#8B5CF6]/10 border-l-2 border-[#8B5CF6] rounded text-bloomberg-text-dim text-[10px]">
          <strong className="text-[#8B5CF6]">Tip:</strong> Type "if" followed by triggers, then "then" followed by actions. 
          Use "and" or "or" to combine conditions. Press <strong className="text-[#8B5CF6]">Tab</strong> to autocomplete.
        </div>

        {/* Status Indicator */}
        {isValidCommand(input) && (
          <div className="ml-12 mt-2 inline-flex items-center gap-2 px-3 py-1.5 bg-bloomberg-green/10 border border-bloomberg-green/30 rounded text-bloomberg-green text-[10px]">
            <div className="w-1.5 h-1.5 bg-bloomberg-green rounded-full animate-pulse"></div>
            <span>Valid strategy</span>
          </div>
        )}
      </div>

      {/* Command Preview */}
      {input.trim() && (
        <div className="mb-6 p-4 bg-[#8B5CF6]/10 border border-[#8B5CF6]/30 rounded-lg border-l-4 border-l-[#8B5CF6]">
          <div className="text-[#8B5CF6] text-[10px] uppercase tracking-wider font-bold mb-2">
            Command Preview
          </div>
          <div 
            className="text-bloomberg-text text-sm font-mono leading-relaxed"
            dangerouslySetInnerHTML={{ __html: formatPreview(input) }}
          />
        </div>
      )}

      {/* Quick Examples */}
      <div className="mt-6">
        <div className="text-[#8B5CF6] text-xs uppercase tracking-wider font-bold mb-3">
          Quick Examples
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {QUICK_EXAMPLES.map((example, index) => (
            <button
              key={index}
              onClick={() => fillExample(example)}
              className="text-left p-3 bg-bloomberg-bg border border-terminal rounded hover:border-[#8B5CF6] hover:bg-bloomberg-panel transition-all"
            >
              <div className="text-bloomberg-text text-xs font-bold mb-1">
                Example {index + 1}
              </div>
              <div className="text-bloomberg-text-dim text-[10px] font-mono line-clamp-2">
                {example}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

