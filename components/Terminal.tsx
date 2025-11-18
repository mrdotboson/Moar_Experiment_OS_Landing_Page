'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { fetchPolymarketMarkets, formatMarketForInput, type PolymarketMarket } from '@/lib/polymarket'
import { fetchHyperliquidMarkets, type HyperliquidMarket } from '@/lib/hyperliquid'
import { fetchPositions, type Position } from '@/lib/positions'
import ParsingAnimation from './ParsingAnimation'

interface TerminalProps {
  onSubmit: (input: string) => void
  flowState: 'start' | 'typing' | 'parsing'
  userInput: string
}

// Searchable asset select component
function SearchableAssetSelect({ 
  value, 
  onChange, 
  markets, 
  loading 
}: { 
  value: string
  onChange: (value: string) => void
  markets: HyperliquidMarket[]
  loading: boolean
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const selectRef = useRef<HTMLDivElement>(null)

  // Filter markets based on search
  const filteredMarkets = markets.filter(market =>
    market.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Sort: selected first, then by volume
  const sortedMarkets = [...filteredMarkets].sort((a, b) => {
    if (a.symbol === value) return -1
    if (b.symbol === value) return 1
    return (b.volume24hUsd || 0) - (a.volume24hUsd || 0)
  })

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchQuery('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedMarket = markets.find(m => m.symbol === value)

  return (
    <div ref={selectRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-bloomberg-bg border border-terminal p-2 text-bloomberg-text text-[10px] outline-none focus:border-[#8B5CF6] flex items-center justify-between"
      >
        <span>{selectedMarket ? selectedMarket.symbol : value || 'Select asset...'}</span>
        <span className="text-bloomberg-text-dim">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-bloomberg-panel border-2 border-terminal max-h-64 overflow-hidden flex flex-col">
          {/* Search input */}
          <div className="p-2 border-b border-terminal">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search assets..."
              className="w-full bg-bloomberg-bg border border-terminal px-2 py-1 text-[9px] text-bloomberg-text outline-none focus:border-[#8B5CF6] placeholder:text-bloomberg-text-dim"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Market list */}
          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="p-3 text-center text-bloomberg-text-dim text-[9px]">
                Loading markets...
              </div>
            ) : sortedMarkets.length === 0 ? (
              <div className="p-3 text-center text-bloomberg-text-dim text-[9px]">
                No markets found
              </div>
            ) : (
              sortedMarkets.map((market) => (
                <button
                  key={market.symbol}
                  type="button"
                  onClick={() => {
                    onChange(market.symbol)
                    setIsOpen(false)
                    setSearchQuery('')
                  }}
                  className={`w-full text-left px-3 py-2 text-[9px] hover:bg-bloomberg-bg transition-colors flex items-center justify-between ${
                    market.symbol === value
                      ? 'bg-[#8B5CF6]/20 text-[#8B5CF6]'
                      : 'text-bloomberg-text hover:text-bloomberg-text'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {market.symbol === value && (
                      <span className="text-[#8B5CF6]">✓</span>
                    )}
                    <span className="font-bold">{market.symbol}</span>
                  </div>
                  <div className="text-bloomberg-text-dim text-[8px]">
                    ${market.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Footer with count */}
          {!loading && sortedMarkets.length > 0 && (
            <div className="p-2 border-t border-terminal text-bloomberg-text-dim text-[7px] text-center">
              {sortedMarkets.length} {sortedMarkets.length === 1 ? 'market' : 'markets'}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Mock existing positions - defined outside component so it can be used in initial state
const mockPositions: Position[] = [
  {
    id: 'POS-001',
    asset: 'ETH',
    direction: 'Long' as const,
    entryPrice: 3125.50,
    currentPrice: 3245.67,
    size: 125000,
    leverage: 3,
    unrealizedPnl: 15012.50,
    unrealizedPnlPercent: 12.0,
    entryTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    liquidationPrice: 2500.00,
    exitConditions: [
      { type: 'polymarket', description: 'Polymarket: Ethereum ETF Approval probability ≥ 75%', status: 'PENDING' }
    ]
  },
  {
    id: 'POS-002',
    asset: 'BTC',
    direction: 'Long' as const,
    entryPrice: 65200.00,
    currentPrice: 67850.42,
    size: 250000,
    leverage: 2,
    unrealizedPnl: 10125.00,
    unrealizedPnlPercent: 4.05,
    entryTime: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
    liquidationPrice: 50000.00,
    exitConditions: []
  },
  {
    id: 'POS-003',
    asset: 'SOL',
    direction: 'Short' as const,
    entryPrice: 148.20,
    currentPrice: 142.89,
    size: 75000,
    leverage: 4,
    unrealizedPnl: 1987.50,
    unrealizedPnlPercent: 2.65,
    entryTime: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
    liquidationPrice: 160.00,
    exitConditions: [
      { type: 'price', description: 'Price above $160', status: 'PENDING' }
    ]
  }
]

// High-impact trading examples - VC-worthy use cases that demonstrate the power of conditional trading
const TRADING_EXAMPLES = [
  'Short BTC if "Fed rate hike" probability ≥ 90% and price above $102k',
  'Increase position by 50% if "Ethereum ETF Approval" probability ≥ 90% and price below $3300',
  'Close all positions if "China attacks Taiwan" probability ≥ 65%',
  'Long BTC 3x if "Bitcoin ETF approval" probability ≥ 70% and OI rises 5% over 24h',
  'Close 50% of short if "Fed rate cut" probability ≥ 100%',
  'Long ETH if "Ethereum ETF Approval" probability ≥ 65% and price below $3200'
]

// Shuffle array function
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export default function Terminal({ onSubmit, flowState, userInput }: TerminalProps) {
  // Shuffle examples once on mount - different order each time someone opens the site
  const shuffledExamples = useMemo(() => shuffleArray(TRADING_EXAMPLES), [])
  
  const [input, setInput] = useState('')
  const [showCursor, setShowCursor] = useState(true)
  const [currentTime, setCurrentTime] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const [exampleIndex, setExampleIndex] = useState(0)
  const [displayedText, setDisplayedText] = useState('')
  const [isTyping, setIsTyping] = useState(true)
  const [userHasTyped, setUserHasTyped] = useState(false)
  const [isBetweenExamples, setIsBetweenExamples] = useState(false)
  const [showPlaceholder, setShowPlaceholder] = useState(false)
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Compute the actual input value to display - for landing page, always show animation
  const inputValue = useMemo(() => {
    // For landing page, always show displayedText (animation)
    if (displayedText && displayedText.length > 0) {
      return displayedText
    }
    return ''
  }, [displayedText])

  // Update time on client only to avoid hydration mismatch
  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString())
    }
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  // Don't auto-focus disabled input on landing page

  // Start animation on mount - ensure it starts properly
  useEffect(() => {
    // Start animation immediately when component mounts in start/typing state
    if ((flowState === 'start' || flowState === 'typing') && displayedText.length === 0) {
      // Start immediately - set first character to trigger animation
      const firstExample = shuffledExamples[0]
      if (firstExample && firstExample.length > 0) {
        // Use setTimeout to ensure state updates properly
        setTimeout(() => {
          setDisplayedText(firstExample[0])
          setIsTyping(true)
          setIsBetweenExamples(false)
        }, 100) // Small delay to ensure component is fully mounted
      }
    }
  }, [flowState, shuffledExamples]) // Only run when flowState changes (on mount)

  useEffect(() => {
    const interval = setInterval(() => {
      setShowCursor((prev) => !prev)
    }, 530)
    return () => clearInterval(interval)
  }, [])

  // Typing animation effect - cycles through examples (always runs on landing page)
  useEffect(() => {
    // Don't animate if not in the right flow state
    if (flowState !== 'start' && flowState !== 'typing') {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current)
        animationTimeoutRef.current = null
      }
      return
    }
    
    // Landing page - always animate (user can't type)

    const currentExample = shuffledExamples[exampleIndex]
    if (!currentExample) return
    
    let timeoutId: NodeJS.Timeout

    if (isTyping) {
      // Typing phase - realistic typing speed with slight variation
      if (displayedText.length < currentExample.length) {
        // If displayedText is empty, start immediately, otherwise use variable delay
        const baseDelay = displayedText.length === 0 ? 0 : 40
        // Add slight randomness to make it feel more human (30-50ms range)
        const delay = baseDelay + (displayedText.length === 0 ? 0 : Math.random() * 20)
        timeoutId = setTimeout(() => {
          setDisplayedText(currentExample.slice(0, displayedText.length + 1))
          setShowPlaceholder(false) // Hide placeholder while typing
        }, delay)
        animationTimeoutRef.current = timeoutId
      } else {
        // Finished typing, wait a bit then start deleting
        timeoutId = setTimeout(() => {
          setIsTyping(false)
        }, 2500) // Show full text for 2.5 seconds
        animationTimeoutRef.current = timeoutId
      }
    } else {
      // Deleting phase - realistic backspace speed
      if (displayedText.length > 0) {
        // Variable backspace speed (15-35ms) to feel more natural
        const delay = 25 + Math.random() * 20
        timeoutId = setTimeout(() => {
          const newText = displayedText.slice(0, -1)
          if (newText.length === 0) {
            // Immediately clear when we reach empty - hide placeholder immediately
            setDisplayedText('')
            setIsBetweenExamples(true)
            setShowPlaceholder(false) // Hide placeholder immediately
            // Start next example after pause
            const nextTimeout = setTimeout(() => {
              setExampleIndex((prev) => (prev + 1) % shuffledExamples.length)
              setIsTyping(true)
              setIsBetweenExamples(false)
            }, 800) // Slightly longer pause between examples
            animationTimeoutRef.current = nextTimeout
          } else {
            setDisplayedText(newText)
            setShowPlaceholder(false) // Keep placeholder hidden while deleting
          }
        }, delay)
        animationTimeoutRef.current = timeoutId
      } else {
        // Already empty - this shouldn't happen but handle it
        setDisplayedText('')
        setIsBetweenExamples(true)
        setShowPlaceholder(false)
        timeoutId = setTimeout(() => {
          setExampleIndex((prev) => (prev + 1) % TRADING_EXAMPLES.length)
          setIsTyping(true)
          setIsBetweenExamples(false)
        }, 800)
        animationTimeoutRef.current = timeoutId
      }
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
        animationTimeoutRef.current = null
      }
    }
  }, [displayedText, isTyping, exampleIndex, flowState, shuffledExamples])

  // Force input to be empty and hide placeholder when displayedText is empty
  useEffect(() => {
    if (displayedText.length === 0) {
      setShowPlaceholder(false) // Hide placeholder immediately
    }
  }, [displayedText])

  const [showHelp, setShowHelp] = useState(false)
  const [showExamples, setShowExamples] = useState(false)
  const [showMarketsModal, setShowMarketsModal] = useState(false)
  const [history, setHistory] = useState<string[]>([])
  const [polymarketMarkets, setPolymarketMarkets] = useState<PolymarketMarket[]>([])
  const [loadingMarkets, setLoadingMarkets] = useState(true)
  const [marketsLastUpdated, setMarketsLastUpdated] = useState<Date | null>(null)
  const [hyperliquidMarkets, setHyperliquidMarkets] = useState<HyperliquidMarket[]>([])
  const [loadingHyperliquid, setLoadingHyperliquid] = useState(true)
  const [hyperliquidLastUpdated, setHyperliquidLastUpdated] = useState<Date | null>(null)
  // Initialize with mock positions so they're visible immediately
  const [positions, setPositions] = useState<Position[]>(mockPositions)
  const [loadingPositions, setLoadingPositions] = useState(false)
  const [showPositionModal, setShowPositionModal] = useState(false)
  const [showConditionBuilder, setShowConditionBuilder] = useState(false)
  const [selectedPolymarketEvent, setSelectedPolymarketEvent] = useState<string>('')
  const [conditionThreshold, setConditionThreshold] = useState<string>('')
  const [conditionAction, setConditionAction] = useState<'close' | 'reduce' | 'reverse' | 'increase'>('close')
  const [partialClosePercent, setPartialClosePercent] = useState<number>(50)
  const [builderConditionPrice, setBuilderConditionPrice] = useState<{ enabled: boolean; type: 'above' | 'below'; value: string }>({ enabled: false, type: 'above', value: '' })
  const [builderConditionOI, setBuilderConditionOI] = useState<{ enabled: boolean; type: 'rises' | 'falls' | 'above' | 'below'; value: string; timeframe?: string }>({ enabled: false, type: 'rises', value: '', timeframe: '24h' })
  const [builderConditionFunding, setBuilderConditionFunding] = useState<{ enabled: boolean; type: 'above' | 'below'; value: string }>({ enabled: false, type: 'above', value: '' })
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    event: true, // Polymarket event always visible
    markets: true, // Live markets always visible
    examples: true, // Examples always visible
    conditions: false,
    position: false,
    exits: false,
    risk: false
  })
  const [showStrategyBuilder, setShowStrategyBuilder] = useState(false)
  const [selectedMarket, setSelectedMarket] = useState<PolymarketMarket | null>(null)
  const [builderMode, setBuilderMode] = useState<'new' | 'adjust'>('new')
  const [builderAsset, setBuilderAsset] = useState('ETH')
  const [builderAction, setBuilderAction] = useState<'Long' | 'Short'>('Long')
  const [builderProbability, setBuilderProbability] = useState(70)
  const [builderPriceCondition, setBuilderPriceCondition] = useState<{ enabled: boolean; type: 'above' | 'below'; value: string }>({ enabled: false, type: 'below', value: '' })
  const [builderOICondition, setBuilderOICondition] = useState<{ enabled: boolean; type: 'above' | 'rises'; value: string }>({ enabled: false, type: 'above', value: '' })
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null)
  const [selectedPositionId, setSelectedPositionId] = useState<string | null>(null) // For builder mode
  const [selectedQuickAction, setSelectedQuickAction] = useState<{
    type: 'close' | 'reverse' | 'increase' | 'reduce'
    baseCommand: string
  } | null>(null)
  const [additionalConditions, setAdditionalConditions] = useState<{
    price?: { enabled: boolean; type: 'above' | 'below'; value: string }
    oi?: { enabled: boolean; type: 'rises' | 'falls' | 'above' | 'below'; value: string; timeframe?: string }
    funding?: { enabled: boolean; type: 'above' | 'below'; value: string }
  }>({})
  const [builderPositionAction, setBuilderPositionAction] = useState<'CLOSE' | 'REVERSE' | 'CANCEL'>('CLOSE')
  const [builderPositionSize, setBuilderPositionSize] = useState(100) // percentage
  const [marketSearchQuery, setMarketSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [availableCategories, setAvailableCategories] = useState<string[]>([])
  const [showMarketRules, setShowMarketRules] = useState(false)
  const [showPendingOrders, setShowPendingOrders] = useState(false)
  const [showActivePositions, setShowActivePositions] = useState(false)
  const [eventSearchQuery, setEventSearchQuery] = useState('') // For searching events in position modal
  const [showEarlyAccessModal, setShowEarlyAccessModal] = useState(false)
  const [earlyAccessEmail, setEarlyAccessEmail] = useState('')
  const [earlyAccessTelegram, setEarlyAccessTelegram] = useState('')
  const [earlyAccessSubmitted, setEarlyAccessSubmitted] = useState(false)

  // Fetch live Polymarket markets on mount and when search/category changes
  useEffect(() => {
    const loadMarkets = async () => {
      setLoadingMarkets(true)
      try {
        const markets = await fetchPolymarketMarkets(marketSearchQuery || undefined, selectedCategory || undefined)
        setPolymarketMarkets(markets)
        
        // Extract unique categories from markets
        const categories = Array.from(new Set(
          markets
            .map(m => m.category)
            .filter((cat): cat is string => !!cat && cat.trim() !== '')
        )).sort()
        setAvailableCategories(categories)
        
        setMarketsLastUpdated(new Date())
      } catch (error) {
        console.error('Failed to load Polymarket markets:', error)
      } finally {
        setLoadingMarkets(false)
      }
    }
    
    // Debounce search to avoid too many API calls
    const timeoutId = setTimeout(loadMarkets, marketSearchQuery ? 300 : 0)
    return () => clearTimeout(timeoutId)
  }, [marketSearchQuery, selectedCategory])
  
  // Initial load (without search)
  useEffect(() => {
    const loadInitialMarkets = async () => {
      if (polymarketMarkets.length === 0 && !marketSearchQuery) {
        setLoadingMarkets(true)
        try {
          const markets = await fetchPolymarketMarkets()
          setPolymarketMarkets(markets)
          setMarketsLastUpdated(new Date())
        } catch (error) {
          console.error('Failed to load Polymarket markets:', error)
        } finally {
          setLoadingMarkets(false)
        }
      }
    }
    
    loadInitialMarkets()
    // Refresh markets every 5 minutes (only when not searching)
    if (!marketSearchQuery) {
      const interval = setInterval(loadInitialMarkets, 5 * 60 * 1000)
      return () => clearInterval(interval)
    }
  }, [])

  // Fetch live Hyperliquid markets on mount
  useEffect(() => {
    const loadHyperliquid = async () => {
      setLoadingHyperliquid(true)
      try {
        const markets = await fetchHyperliquidMarkets()
        setHyperliquidMarkets(markets)
        setHyperliquidLastUpdated(new Date())
      } catch (error) {
        console.error('Failed to load Hyperliquid markets:', error)
      } finally {
        setLoadingHyperliquid(false)
      }
    }
    
    loadHyperliquid()
    // Refresh every 30 seconds for price updates
    const interval = setInterval(loadHyperliquid, 30000)
    return () => clearInterval(interval)
  }, [])

  // Fetch open positions on mount
  useEffect(() => {
    const loadPositions = async () => {
      setLoadingPositions(true)
      try {
        const userPositions = await fetchPositions()
        // Use fetched positions, or fallback to mock positions if empty
        if (userPositions.length > 0) {
          setPositions(userPositions)
        } else {
          // Fallback to mock positions for demo
          setPositions(mockPositions)
        }
      } catch (error) {
        console.error('Failed to load positions:', error)
        // Fallback to mock positions on error
        setPositions(mockPositions)
      } finally {
        setLoadingPositions(false)
      }
    }
    
    loadPositions()
    // Refresh every 10 seconds for position updates
    const interval = setInterval(loadPositions, 10000)
    return () => clearInterval(interval)
  }, [])

  // Sync position prices with live market data (more frequent updates)
  useEffect(() => {
    if (positions.length > 0 && hyperliquidMarkets.length > 0) {
      setPositions(prevPositions => 
        prevPositions.map(pos => {
          const market = hyperliquidMarkets.find(m => m.symbol.toUpperCase() === pos.asset.toUpperCase())
          if (market) {
            const newPrice = market.price
            const oldPrice = pos.currentPrice
            const newPnl = pos.direction === 'Long' 
              ? (newPrice - pos.entryPrice) * (pos.size / pos.entryPrice)
              : (pos.entryPrice - newPrice) * (pos.size / pos.entryPrice)
            const newPnlPercent = ((newPrice - pos.entryPrice) / pos.entryPrice) * 100 * (pos.direction === 'Long' ? 1 : -1)
            
            return {
              ...pos,
              currentPrice: newPrice,
              unrealizedPnl: newPnl,
              unrealizedPnlPercent: newPnlPercent,
              priceChange: newPrice !== oldPrice ? (newPrice > oldPrice ? 'up' : 'down') : undefined
            }
          }
          return pos
        })
      )
    }
  }, [hyperliquidMarkets])

  const surpriseMe = useCallback(() => {
    // Landing page - do not generate random strategies
    // This function is disabled for landing page demo
  }, [])

  useEffect(() => {
    // Only attach keyboard handler when in start or typing state
    if (flowState !== 'start' && flowState !== 'typing') {
      return
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      // Enter: Disabled for landing page - no submission
      if (e.key === 'Enter' && input.trim() && !showHelp && !showExamples) {
        e.preventDefault()
        e.stopPropagation()
        // Landing page - do not submit strategies
        return
      }
      
      // ESC: Close modals
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        if (showEarlyAccessModal) {
          setShowEarlyAccessModal(false)
          setEarlyAccessEmail('')
          setEarlyAccessTelegram('')
          setEarlyAccessSubmitted(false)
        }
        setShowHelp(false)
        setShowExamples(false)
        setShowStrategyBuilder(false)
        setShowMarketsModal(false)
        setShowMarketRules(false)
        return
      }
      // F1: Help
      if (e.key === 'F1') {
        e.preventDefault()
        e.stopPropagation()
        setShowHelp(prev => !prev)
        setShowExamples(false)
        return
      }
      // F2: Examples
      if (e.key === 'F2') {
        e.preventDefault()
        e.stopPropagation()
        setShowExamples(prev => !prev)
        setShowHelp(false)
        return
      }
      // F3: History
      if (e.key === 'F3') {
        e.preventDefault()
        e.stopPropagation()
        if (history.length > 0) {
          setInput(history[0])
          setTimeout(() => inputRef.current?.focus(), 0)
        }
        return
      }
      // F4: Random strategy
      if (e.key === 'F4') {
        e.preventDefault()
        e.stopPropagation()
        surpriseMe()
        return
      }
      // F5: Expand markets modal
      if (e.key === 'F5') {
        e.preventDefault()
        e.stopPropagation()
        setShowMarketsModal(prev => !prev)
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown, true) // Use capture phase
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [input, showHelp, showExamples, onSubmit, flowState, history, surpriseMe, showEarlyAccessModal])

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Enter is handled globally, but prevent form submission
    if (e.key === 'Enter') {
      e.preventDefault()
      return
    }
    // Up arrow: cycle through history
    if (e.key === 'ArrowUp' && history.length > 0) {
      e.preventDefault()
      const lastInput = history[0]
      setInput(lastInput)
    }
  }

  if (flowState === 'parsing') {
    return <ParsingAnimation userInput={userInput} />
  }

  return (
    <div className="absolute inset-0 bg-bloomberg-bg z-10">
      {/* Top Status Bar */}
      <div className="bg-bloomberg-panel border-b border-terminal h-6 flex items-center justify-between px-2 text-xs">
        <div className="flex items-center gap-2 md:gap-4">
          <span className="text-bloomberg-orange font-bold">CATALYST</span>
          <span className="hidden sm:inline text-bloomberg-text-dim">v1.0.0</span>
          <span className="text-bloomberg-green">●</span>
          <span className="hidden sm:inline text-bloomberg-text-dim">ONLINE</span>
        </div>
        <div className="flex items-center gap-2 md:gap-4 text-bloomberg-text-dim">
          <span className="hidden md:inline">USER: TRADER_001</span>
          <span className="hidden md:inline">|</span>
          <span suppressHydrationWarning className="text-[10px] md:text-xs">{currentTime || '--:--:--'}</span>
        </div>
      </div>

      {/* Main Terminal Area */}
      <div className="h-[calc(100%-24px)] flex overflow-hidden relative">
        {/* Left Sidebar - Optimized Command Reference */}
        <div className="hidden md:block absolute left-0 top-0 bottom-0 w-64 bg-bloomberg-panel border-r border-terminal p-3 text-xs overflow-y-auto z-10">
          <div className="text-[#8B5CF6] font-bold mb-3 uppercase text-xs border-b border-terminal pb-2">Command Reference</div>
          
          {/* Priority 1: Polymarket Event (Always Visible) */}
          <div className="mb-3 pb-2 border-b border-terminal">
            <div className="flex items-center justify-between mb-1">
              <div className="text-[#8B5CF6] font-bold text-[10px] uppercase">POLYMARKET EVENT</div>
              <div className="text-bloomberg-red text-[8px] font-mono">REQUIRED</div>
            </div>
            <div className="pl-2 text-[10px] space-y-0.5 text-bloomberg-text">
              <div className="font-mono">if Polymarket "Event" probability ≥ X%</div>
              <div className="text-bloomberg-text-dim text-[9px] mt-0.5">Use quotes for event names</div>
            </div>
          </div>

          {/* Priority 1.5: Live Polymarket Markets */}
          <div className="mb-3 pb-2 border-b border-terminal">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <div className="text-[#8B5CF6] font-bold text-[10px] uppercase">LIVE MARKETS</div>
                {!loadingMarkets && marketsLastUpdated && (
                  <div className="text-bloomberg-green text-[7px] font-mono">
                    ●
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowMarketsModal(true)
                  }}
                  className="text-bloomberg-text-dim hover:text-[#8B5CF6] text-[8px] font-mono cursor-pointer px-1 py-0.5 hover:bg-bloomberg-bg/50"
                  title="Expand to full screen (F5)"
                >
                  ⛶
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setExpandedSections(prev => ({ ...prev, markets: !prev.markets }))
                  }}
                  className="text-bloomberg-text-dim hover:text-bloomberg-text text-[9px] font-mono cursor-pointer px-1 py-0.5 hover:bg-bloomberg-bg/50"
                >
                  {expandedSections.markets ? '−' : '+'}
                </button>
              </div>
            </div>
            {expandedSections.markets && (
              <div className="pl-2 text-[10px] space-y-1 mt-1">
                {/* Search Input */}
                <div className="mb-2">
                  <input
                    type="text"
                    value={marketSearchQuery}
                    onChange={(e) => setMarketSearchQuery(e.target.value)}
                    placeholder="Search markets..."
                    className="w-full bg-bloomberg-bg border border-terminal px-2 py-1 text-[9px] text-bloomberg-text outline-none focus:border-[#8B5CF6] placeholder:text-bloomberg-text-dim"
                  />
                </div>
                <div className="max-h-64 overflow-auto">
                  {loadingMarkets ? (
                    <div className="text-bloomberg-text-dim text-[9px] py-2 flex items-center gap-1">
                      <span className="animate-pulse">●</span>
                      <span>Loading live markets...</span>
                    </div>
                  ) : polymarketMarkets.length === 0 ? (
                    <div className="text-bloomberg-text-dim text-[9px] py-2">No markets available</div>
                  ) : (
                    <>
                      {marketsLastUpdated && (
                        <div className="text-bloomberg-text-dim text-[7px] mb-1 italic">
                          Updated {marketsLastUpdated.toLocaleTimeString()}
                          {marketSearchQuery.trim() && ` • ${polymarketMarkets.length} results`}
                        </div>
                      )}
                      {polymarketMarkets.length === 0 ? (
                        <div className="text-bloomberg-text-dim text-[9px] py-2">
                          {marketSearchQuery.trim() 
                            ? `No markets match "${marketSearchQuery}"`
                            : 'No markets available'}
                        </div>
                      ) : (
                        // Show top 10 most relevant markets (sorted by liquidity)
                        polymarketMarkets.slice(0, 10).map((market) => {
                      const prob = market.currentProbability || 70
                      const liquidityK = market.liquidity >= 1000000 
                        ? (market.liquidity / 1000000).toFixed(1) + 'M'
                        : (market.liquidity / 1000).toFixed(0) + 'K'
                      
                      // Auto-suggest asset based on event name
                      const suggestAsset = (question: string): string => {
                        const q = question.toLowerCase()
                        if (q.includes('bitcoin') || q.includes('btc')) return 'BTC'
                        if (q.includes('ethereum') || q.includes('eth')) return 'ETH'
                        if (q.includes('solana') || q.includes('sol')) return 'SOL'
                        if (q.includes('avalanche') || q.includes('avax')) return 'AVAX'
                        if (q.includes('arbitrum') || q.includes('arb')) return 'ARB'
                        if (q.includes('optimism') || q.includes('op')) return 'OP'
                        return 'ETH' // Default
                      }
                      
                      return (
                        <div
                          key={market.id}
                          className="p-1.5 border border-transparent group"
                          title={market.question}
                        >
                          <div className="flex items-start justify-between gap-1 mb-0.5">
                            <div className="text-[#8B5CF6] text-[9px] font-bold flex-1 line-clamp-2 group-hover:text-[#8B5CF6]">
                              {market.question}
                            </div>
                            <div className="text-bloomberg-green text-[8px] font-bold whitespace-nowrap ml-1">
                              {prob.toFixed(0)}%
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-[7px] text-bloomberg-text-dim">
                            <span>${liquidityK} liquidity</span>
                            <span className="text-bloomberg-green">● Live</span>
                          </div>
                        </div>
                      )
                    }))}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Priority 2: Quick Examples (Always Visible) */}
          <div className="mb-3 pb-2 border-b border-terminal">
            <div className="flex items-center justify-between mb-1">
              <div className="text-bloomberg-green font-bold text-[10px] uppercase">EXAMPLES</div>
              <button
                type="button"
                onClick={() => {
                  setExpandedSections(prev => ({ ...prev, examples: !prev.examples }))
                }}
                className="text-bloomberg-text-dim hover:text-bloomberg-text text-[9px] font-mono cursor-pointer px-1 py-0.5 hover:bg-bloomberg-bg/50"
              >
                {expandedSections.examples ? '−' : '+'}
              </button>
            </div>
            {expandedSections.examples && (
              <div className="pl-2 text-[10px] space-y-1 mt-1">
                <div className="cursor-pointer hover:text-[#8B5CF6] transition-colors p-1.5 hover:bg-bloomberg-bg border border-transparent hover:border-terminal" onClick={() => setInput('Long BTC 3x if "Bitcoin ETF approval" probability ≥ 70% and OI rises 5% over 24h')}>
                  Long BTC 3x if "Bitcoin ETF approval" probability ≥ 70% and OI rises 5% over 24h
                </div>
                <div className="cursor-pointer hover:text-[#8B5CF6] transition-colors p-1.5 hover:bg-bloomberg-bg border border-transparent hover:border-terminal" onClick={() => setInput('Short BTC if "Fed rate hike" probability ≥ 90% and price above $102k')}>
                  Short BTC if "Fed rate hike" probability ≥ 90% and price above $102k
                </div>
                <div className="cursor-pointer hover:text-[#8B5CF6] transition-colors p-1.5 hover:bg-bloomberg-bg border border-transparent hover:border-terminal" onClick={() => setInput('Close all positions if "China attacks Taiwan" probability ≥ 65%')}>
                  Close all positions if "China attacks Taiwan" probability ≥ 65%
                </div>
              </div>
            )}
          </div>

          {/* Priority 1: Position Management - THE KILLER FEATURE */}
          <div className="mb-2">
            <div
              onClick={() => {
                setExpandedSections(prev => {
                  const newValue = !prev.position
                  return { ...prev, position: newValue }
                })
              }}
              className="w-full flex items-center justify-between text-bloomberg-orange font-bold text-[10px] uppercase mb-1 hover:text-bloomberg-text transition-colors cursor-pointer py-1 px-1 hover:bg-bloomberg-bg/50 select-none"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setExpandedSections(prev => {
                    const newValue = !prev.position
                    return { ...prev, position: newValue }
                  })
                }
              }}
            >
              <span>POSITION MANAGEMENT</span>
              <span className="text-bloomberg-text-dim text-[9px] font-mono">{expandedSections.position ? '−' : '+'}</span>
            </div>
            {expandedSections.position && (
              <div className="pl-2 text-[10px] space-y-1 mt-1">
                <div className="text-bloomberg-text-dim text-[8px] mb-0.5 italic">Protect profits when events resolve</div>
                <div className="cursor-pointer hover:text-[#8B5CF6] transition-colors p-1.5 hover:bg-bloomberg-bg border border-transparent hover:border-terminal bg-bloomberg-green/10 border-bloomberg-green/30" onClick={() => setInput('Close position if "Ethereum ETF Approval" probability ≥ 75%')}>
                  Close position if "Ethereum ETF Approval" probability ≥ 75%
                </div>
                <div className="cursor-pointer hover:text-[#8B5CF6] transition-colors p-1.5 hover:bg-bloomberg-bg border border-transparent hover:border-terminal" onClick={() => setInput('Close 50% of position if "Bitcoin hits $100k" probability ≥ 80%')}>
                  Close 50% of position if "Bitcoin hits $100k" probability ≥ 80%
                </div>
                <div className="cursor-pointer hover:text-[#8B5CF6] transition-colors p-1.5 hover:bg-bloomberg-bg border border-transparent hover:border-terminal" onClick={() => setInput('Reverse position when "Bitcoin hits $100k" probability ≥ 80% and price above $95000')}>
                  Reverse position when "Bitcoin hits $100k" probability ≥ 80% and price above $95000
                </div>
              </div>
            )}
          </div>

          {/* Priority 2: Polymarket Exits - Advanced Risk Management */}
          <div className="mb-2">
            <div
              onClick={() => {
                setExpandedSections(prev => {
                  const newValue = !prev.exits
                  return { ...prev, exits: newValue }
                })
              }}
              className="w-full flex items-center justify-between text-bloomberg-green font-bold text-[10px] uppercase mb-1 hover:text-bloomberg-text transition-colors cursor-pointer py-1 px-1 hover:bg-bloomberg-bg/50 select-none"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setExpandedSections(prev => {
                    const newValue = !prev.exits
                    return { ...prev, exits: newValue }
                  })
                }
              }}
            >
              <span>POLYMARKET EXITS</span>
              <span className="text-bloomberg-text-dim text-[9px] font-mono">{expandedSections.exits ? '−' : '+'}</span>
            </div>
            {expandedSections.exits && (
              <div className="pl-2 text-[10px] space-y-1 mt-1">
                <div className="text-bloomberg-text-dim text-[8px] mb-0.5 italic">Exit before market moves against you</div>
                <div className="cursor-pointer hover:text-[#8B5CF6] transition-colors p-1.5 hover:bg-bloomberg-bg border border-transparent hover:border-terminal bg-bloomberg-red/10 border-bloomberg-red/30" onClick={() => setInput('Close position if "Ethereum ETF Approval" probability drops 5% in 1h')}>
                  Close if probability drops 5% in 1h
                </div>
                <div className="cursor-pointer hover:text-[#8B5CF6] transition-colors p-1.5 hover:bg-bloomberg-bg border border-transparent hover:border-terminal" onClick={() => setInput('Close position if "Bitcoin ETF Approval" event resolves before probability reaches 75%')}>
                  Close if event resolves early
                </div>
                <div className="cursor-pointer hover:text-[#8B5CF6] transition-colors p-1.5 hover:bg-bloomberg-bg border border-transparent hover:border-terminal" onClick={() => setInput('Close position if "Fed cuts rates" market liquidity drops below $500K')}>
                  Close if market liquidity drops below $500K
                </div>
                <div className="cursor-pointer hover:text-[#8B5CF6] transition-colors p-1.5 hover:bg-bloomberg-bg border border-transparent hover:border-terminal" onClick={() => setInput('Close position if "Event" probability drops below 50%')}>
                  Close if probability drops below 50%
                </div>
              </div>
            )}
          </div>

          {/* Priority 3: Additional Conditions */}
          <div className="mb-2">
            <div
              onClick={() => {
                setExpandedSections(prev => {
                  const newValue = !prev.conditions
                  return { ...prev, conditions: newValue }
                })
              }}
              className="w-full flex items-center justify-between text-bloomberg-green font-bold text-[10px] uppercase mb-1 hover:text-bloomberg-text transition-colors cursor-pointer py-1 px-1 hover:bg-bloomberg-bg/50 select-none"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setExpandedSections(prev => {
                    const newValue = !prev.conditions
                    return { ...prev, conditions: newValue }
                  })
                }
              }}
            >
              <span>ADDITIONAL CONDITIONS</span>
              <span className="text-bloomberg-text-dim text-[9px] font-mono">{expandedSections.conditions ? '−' : '+'}</span>
            </div>
            {expandedSections.conditions && (
              <div className="pl-2 text-[10px] space-y-1 mt-1">
                <div className="text-bloomberg-text-dim text-[9px] mb-0.5">Open Interest (OI):</div>
                <div className="cursor-pointer hover:text-[#8B5CF6] transition-colors p-1.5 hover:bg-bloomberg-bg border border-transparent hover:border-terminal" onClick={() => setInput('Long BTC when "Bitcoin ETF approval" probability ≥ 70% and OI rises 5% over 24h')}>
                  OI rises 5% over 24h
                </div>
                <div className="cursor-pointer hover:text-[#8B5CF6] transition-colors p-1.5 hover:bg-bloomberg-bg border border-transparent hover:border-terminal" onClick={() => setInput('Long ETH if "Ethereum ETF Approval" probability ≥ 65% and OI above $2.2B')}>
                  OI above $2.2B
                </div>
                <div className="text-bloomberg-text-dim text-[9px] mt-1 mb-0.5">Price Levels:</div>
                <div className="cursor-pointer hover:text-[#8B5CF6] transition-colors p-1.5 hover:bg-bloomberg-bg border border-transparent hover:border-terminal" onClick={() => setInput('Long ETH if "Fed cuts rates" probability ≥ 70% and price above $3000')}>
                  Price above $3000
                </div>
                <div className="cursor-pointer hover:text-[#8B5CF6] transition-colors p-1.5 hover:bg-bloomberg-bg border border-transparent hover:border-terminal" onClick={() => setInput('Long BTC if "Bitcoin becomes legal tender" probability ≥ 60% and price below $70000')}>
                  Price below $70000
                </div>
              </div>
            )}
          </div>

          {/* Priority 4: Risk Parameters - Standard, least exciting */}
          <div className="mb-2">
            <div
              onClick={() => {
                setExpandedSections(prev => {
                  const newValue = !prev.risk
                  return { ...prev, risk: newValue }
                })
              }}
              className="w-full flex items-center justify-between text-bloomberg-text-dim font-bold text-[10px] uppercase mb-1 hover:text-bloomberg-text transition-colors cursor-pointer py-1 px-1 hover:bg-bloomberg-bg/50 select-none"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setExpandedSections(prev => {
                    const newValue = !prev.risk
                    return { ...prev, risk: newValue }
                  })
                }
              }}
            >
              <span>RISK PARAMETERS</span>
              <span className="text-bloomberg-text-dim text-[9px] font-mono">{expandedSections.risk ? '−' : '+'}</span>
            </div>
            {expandedSections.risk && (
              <div className="pl-2 text-[10px] space-y-1 mt-1">
                <div className="text-bloomberg-text-dim text-[8px] mb-0.5 italic">Set in strategy spec screen</div>
                <div className="text-bloomberg-text-dim text-[9px]">
                  <div className="flex justify-between">
                    <span>Stop Loss:</span>
                    <span className="text-bloomberg-red">2.0%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Take Profit:</span>
                    <span className="text-bloomberg-green">4.0%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Leverage:</span>
                    <span className="text-bloomberg-text">2x</span>
                  </div>
                  <div className="flex justify-between mt-0.5 pt-0.5 border-t border-terminal/30">
                    <span>Risk/Reward:</span>
                    <span className="text-bloomberg-text">1:2</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className={`flex-1 flex flex-col min-w-0 overflow-hidden ml-64 relative`}>
          {/* Terminal Header - Optimized Value Proposition */}
          <div className="bg-bloomberg-bg border-b border-terminal px-4 py-1.5 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[#8B5CF6] text-xs font-bold uppercase">Event-Aware Conditional Orders</div>
                <div className="text-bloomberg-text-dim text-[9px] mt-0.5">Trade automatically when Polymarket events trigger + market conditions align</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="px-2 py-0.5 bg-bloomberg-green/20 border border-bloomberg-green text-bloomberg-green text-[8px] font-mono">
                  ● POLYMARKET CONNECTED
                </div>
                <div className="px-2 py-0.5 bg-bloomberg-green/20 border border-bloomberg-green text-bloomberg-green text-[8px] font-mono">
                  ● HYPERLIQUID CONNECTED
                </div>
              </div>
            </div>
          </div>

          {/* Hyperliquid Markets Ticker - Scrolling Conveyor Belt */}
          {hyperliquidMarkets.length > 0 && !loadingHyperliquid && (
            <div className="bg-bloomberg-panel border-b border-terminal overflow-hidden relative h-8 flex-shrink-0">
              <div className="flex items-center h-full">
                <div className="bg-bloomberg-green text-bloomberg-bg px-3 py-1 text-[9px] font-bold uppercase whitespace-nowrap z-10 flex-shrink-0">
                  HYPERLIQUID
                </div>
                <div className="flex-1 overflow-hidden relative">
                  <div className="flex items-center h-full animate-scroll-left">
                    {/* Show only BTC, ETH, SOL */}
                    {(() => {
                      // Filter for only BTC, ETH, SOL
                      const cryptoMarkets = hyperliquidMarkets.filter(market => {
                        const symbol = market.symbol.toUpperCase()
                        return symbol === 'BTC' || symbol === 'ETH' || symbol === 'SOL'
                      })
                      
                      // Sort in order: BTC, ETH, SOL
                      const sortedMarkets = cryptoMarkets.sort((a, b) => {
                        const priority = { 'BTC': 1, 'ETH': 2, 'SOL': 3 }
                        const aPriority = priority[a.symbol.toUpperCase() as keyof typeof priority] || 4
                        const bPriority = priority[b.symbol.toUpperCase() as keyof typeof priority] || 4
                        return aPriority - bPriority
                      }).slice(0, 3)
                      
                      // Duplicate for seamless scrolling
                      return [...sortedMarkets, ...sortedMarkets].map((market, idx) => {
                      const volumeM = market.volume24hUsd >= 1000000 
                        ? (market.volume24hUsd / 1000000).toFixed(1) + 'M'
                        : (market.volume24hUsd / 1000).toFixed(0) + 'K'
                      const priceFormatted = market.price >= 1000
                        ? market.price.toLocaleString(undefined, { maximumFractionDigits: 0 })
                        : market.price.toFixed(2)
                      const changeColor = market.change24h >= 0 ? 'text-bloomberg-green' : 'text-bloomberg-red'
                      const changeSign = market.change24h >= 0 ? '+' : ''
                      return (
                        <div
                          key={`${market.symbol}-${idx}`}
                          className="flex items-center gap-3 px-4 whitespace-nowrap"
                        >
                          <div className="text-bloomberg-text text-[9px] font-bold">
                            {market.symbol}
                          </div>
                          <div className="text-bloomberg-text text-[9px]">
                            ${priceFormatted}
                          </div>
                          <div className={`${changeColor} text-[9px] font-bold`}>
                            {changeSign}{market.change24h.toFixed(2)}%
                          </div>
                          <div className="text-bloomberg-text-dim text-[8px]">
                            ${volumeM} vol
                          </div>
                          <div className="w-px h-4 bg-terminal"></div>
                        </div>
                      )
                    })
                    })()}
                  </div>
                </div>
                {hyperliquidLastUpdated && (
                  <div className="text-bloomberg-text-dim text-[7px] px-2 whitespace-nowrap z-10 flex-shrink-0 bg-bloomberg-panel">
                    {hyperliquidLastUpdated.toLocaleTimeString()}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {loadingHyperliquid && (
            <div className="bg-bloomberg-panel border-b border-terminal px-4 py-1.5 h-8 flex items-center flex-shrink-0">
              <div className="text-bloomberg-text-dim text-[9px] flex items-center gap-2">
                <span className="animate-pulse">●</span>
                <span>Loading Hyperliquid markets...</span>
              </div>
            </div>
          )}



          {/* Position Management Modal */}
          {showPositionModal && selectedPosition && (
            <div 
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={(e) => {
                // Only close if clicking the backdrop, not the modal content
                if (e.target === e.currentTarget) {
                  setShowPositionModal(false)
                  setSelectedPosition(null)
                  setShowConditionBuilder(false)
                  setSelectedPolymarketEvent('')
                  setConditionThreshold('')
                  setConditionAction('close')
                  setPartialClosePercent(50)
                  setEventSearchQuery('')
                  setSelectedQuickAction(null)
                  setAdditionalConditions({})
                  setBuilderConditionPrice({ enabled: false, type: 'above', value: '' })
                  setBuilderConditionOI({ enabled: false, type: 'rises', value: '', timeframe: '24h' })
                  setBuilderConditionFunding({ enabled: false, type: 'above', value: '' })
                }
              }}
            >
              <div 
                className="bg-bloomberg-panel border border-terminal w-full max-w-3xl max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-4 border-b border-terminal">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-bloomberg-text font-bold text-sm">
                          Manage Position: {selectedPosition.asset} {selectedPosition.direction}
                        </h3>
                        <span className={`px-2 py-0.5 text-[8px] font-bold ${
                          selectedPosition.unrealizedPnl >= 0 
                            ? 'bg-bloomberg-green/20 text-bloomberg-green' 
                            : 'bg-bloomberg-red/20 text-bloomberg-red'
                        }`}>
                          {selectedPosition.unrealizedPnl >= 0 ? '+' : ''}{selectedPosition.unrealizedPnlPercent.toFixed(2)}%
                        </span>
                      </div>
                      {/* P&L Display - Prominent */}
                      <div className="mb-3 p-3 bg-bloomberg-bg border border-terminal">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-bloomberg-text-dim text-[9px] uppercase">Unrealized P&L</div>
                          <div className={`text-[14px] font-bold ${selectedPosition.unrealizedPnl >= 0 ? 'text-bloomberg-green' : 'text-bloomberg-red'}`}>
                            {selectedPosition.unrealizedPnl >= 0 ? '+' : ''}${selectedPosition.unrealizedPnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className={`text-[12px] font-bold ${selectedPosition.unrealizedPnl >= 0 ? 'text-bloomberg-green' : 'text-bloomberg-red'}`}>
                            {selectedPosition.unrealizedPnl >= 0 ? '+' : ''}{selectedPosition.unrealizedPnlPercent.toFixed(2)}%
                          </div>
                          <div className="text-bloomberg-text-dim text-[8px]">
                            {selectedPosition.direction === 'Long' 
                              ? `+${((selectedPosition.currentPrice - selectedPosition.entryPrice) / selectedPosition.entryPrice * 100).toFixed(2)}% from entry`
                              : `+${((selectedPosition.entryPrice - selectedPosition.currentPrice) / selectedPosition.entryPrice * 100).toFixed(2)}% from entry`
                            }
                          </div>
                        </div>
                      </div>

                      {/* Position Details Grid */}
                      <div className="grid grid-cols-4 gap-3 text-[9px] mb-2">
                        <div>
                          <div className="text-bloomberg-text-dim">Entry Price</div>
                          <div className="text-bloomberg-text font-bold">${selectedPosition.entryPrice.toFixed(2)}</div>
                        </div>
                        <div>
                          <div className="text-bloomberg-text-dim">Current Price</div>
                          <div className="text-bloomberg-text font-bold">${selectedPosition.currentPrice.toFixed(2)}</div>
                        </div>
                        <div>
                          <div className="text-bloomberg-text-dim">Position Size</div>
                          <div className="text-bloomberg-text font-bold">${(selectedPosition.size / 1000).toFixed(0)}K</div>
                        </div>
                        <div>
                          <div className="text-bloomberg-text-dim">Leverage</div>
                          <div className="text-bloomberg-text font-bold">{selectedPosition.leverage}x</div>
                        </div>
                      </div>
                      
                      {/* Additional Metrics */}
                      <div className="grid grid-cols-3 gap-3 text-[8px]">
                        {selectedPosition.liquidationPrice && (
                          <div>
                            <div className="text-bloomberg-text-dim">Liquidation</div>
                            <div className="text-bloomberg-text">
                              ${selectedPosition.liquidationPrice.toFixed(2)}
                              <span className="text-bloomberg-text-dim ml-1">
                                ({selectedPosition.direction === 'Long' 
                                  ? ((selectedPosition.currentPrice - selectedPosition.liquidationPrice) / selectedPosition.currentPrice * 100).toFixed(1)
                                  : ((selectedPosition.liquidationPrice - selectedPosition.currentPrice) / selectedPosition.currentPrice * 100).toFixed(1)
                                }% away)
                              </span>
                            </div>
                          </div>
                        )}
                        <div>
                          <div className="text-bloomberg-text-dim">Margin Used</div>
                          <div className="text-bloomberg-text">
                            ${(selectedPosition.size / selectedPosition.leverage / 1000).toFixed(1)}K
                          </div>
                        </div>
                        <div>
                          <div className="text-bloomberg-text-dim">Time in Position</div>
                          <div className="text-bloomberg-text">
                            {(() => {
                              const minutes = Math.floor((Date.now() - new Date(selectedPosition.entryTime).getTime()) / (1000 * 60))
                              if (minutes < 60) return `${minutes}m`
                              const hours = Math.floor(minutes / 60)
                              const mins = minutes % 60
                              return `${hours}h ${mins}m`
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setShowPositionModal(false)
                        setSelectedPosition(null)
                        setShowConditionBuilder(false)
                        setSelectedPolymarketEvent('')
                        setConditionThreshold('')
                        setConditionAction('close')
                        setPartialClosePercent(50)
                        setEventSearchQuery('')
                        setBuilderConditionPrice({ enabled: false, type: 'above', value: '' })
                        setBuilderConditionOI({ enabled: false, type: 'rises', value: '', timeframe: '24h' })
                        setBuilderConditionFunding({ enabled: false, type: 'above', value: '' })
                      }}
                      className="text-bloomberg-text-dim hover:text-bloomberg-text ml-4"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                
                <div className="p-4">

                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-bloomberg-text text-xs font-bold">
                        Add Conditional Automation
                      </h4>
                      <button
                        onClick={() => setShowConditionBuilder(!showConditionBuilder)}
                        className="text-[#8B5CF6] text-[9px] font-bold hover:underline"
                      >
                        {showConditionBuilder ? 'Use Text Input' : 'Use Builder'}
                      </button>
                    </div>

                    {showConditionBuilder ? (
                      /* Visual Condition Builder */
                      <div className="bg-bloomberg-bg border border-terminal p-4 space-y-3">
                        {/* Visual Preview of Rule */}
                        {(selectedPolymarketEvent || conditionThreshold || conditionAction !== 'close' || builderConditionPrice.enabled || builderConditionOI.enabled || builderConditionFunding.enabled) && (
                          <div className="bg-bloomberg-panel border-2 border-[#8B5CF6]/30 p-3 mb-3">
                            <div className="text-bloomberg-text-dim text-[8px] uppercase mb-1.5">Preview</div>
                            <div className="text-bloomberg-text text-[10px] font-mono leading-relaxed">
                              <span className="text-bloomberg-orange">
                                {conditionAction === 'close' ? 'Close' : 
                                 conditionAction === 'reverse' ? 'Reverse' : 
                                 conditionAction === 'reduce' ? `Reduce by ${partialClosePercent}%` : 
                                 `Increase by ${partialClosePercent}%`}
                              </span>
                              {' '}
                              <span className="text-bloomberg-text">{selectedPosition?.asset} {selectedPosition?.direction.toLowerCase()}</span>
                              {' '}
                              <span className="text-bloomberg-text-dim">position</span>
                              {selectedPolymarketEvent && (
                                <>
                                  {' '}
                                  <span className="text-bloomberg-text-dim">if</span>
                                  {' '}
                                  <span className="text-[#8B5CF6]">Polymarket "{selectedPolymarketEvent}"</span>
                                </>
                              )}
                              {conditionThreshold && (
                                <>
                                  {' '}
                                  <span className="text-bloomberg-text-dim">probability</span>
                                  {' '}
                                  <span className="text-bloomberg-green">≥ {conditionThreshold}%</span>
                                </>
                              )}
                              {builderConditionPrice.enabled && builderConditionPrice.value && (
                                <>
                                  {' '}
                                  <span className="text-bloomberg-text-dim">AND</span>
                                  {' '}
                                  <span className="text-bloomberg-text">price {builderConditionPrice.type} {builderConditionPrice.value}</span>
                                </>
                              )}
                              {builderConditionOI.enabled && builderConditionOI.value && (
                                <>
                                  {' '}
                                  <span className="text-bloomberg-text-dim">AND</span>
                                  {' '}
                                  <span className="text-bloomberg-text">
                                    OI {builderConditionOI.type === 'rises' ? 'rises' : builderConditionOI.type === 'falls' ? 'falls' : builderConditionOI.type} {builderConditionOI.value}
                                    {builderConditionOI.type === 'rises' || builderConditionOI.type === 'falls' ? ` over ${builderConditionOI.timeframe || '24h'}` : ''}
                                  </span>
                                </>
                              )}
                              {builderConditionFunding.enabled && builderConditionFunding.value && (
                                <>
                                  {' '}
                                  <span className="text-bloomberg-text-dim">AND</span>
                                  {' '}
                                  <span className="text-bloomberg-text">funding rate {builderConditionFunding.type} {builderConditionFunding.value}</span>
                                </>
                              )}
                              {!selectedPolymarketEvent && !conditionThreshold && (
                                <span className="text-bloomberg-text-dim italic">Configure conditions below...</span>
                              )}
                            </div>
                            {/* Validation Status */}
                            <div className="mt-2 pt-2 border-t border-terminal">
                              {!selectedPolymarketEvent ? (
                                <div className="flex items-center gap-1.5 text-bloomberg-text-dim text-[8px]">
                                  <span className="text-bloomberg-red">⚠</span>
                                  <span>Select an event to continue</span>
                                </div>
                              ) : !conditionThreshold ? (
                                <div className="flex items-center gap-1.5 text-bloomberg-text-dim text-[8px]">
                                  <span className="text-bloomberg-red">⚠</span>
                                  <span>Set probability threshold</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5 text-bloomberg-green text-[8px]">
                                  <span>✓</span>
                                  <span>Ready to create automation</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        {/* Action Selection */}
                        <div>
                          <label className="text-bloomberg-text-dim text-[9px] uppercase mb-1 block">Action</label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => setConditionAction('close')}
                              className={`py-2 border text-[9px] font-bold transition-colors ${
                                conditionAction === 'close'
                                  ? 'bg-[#8B5CF6]/20 border-[#8B5CF6] text-[#8B5CF6]'
                                  : 'bg-bloomberg-bg border-terminal text-bloomberg-text-dim hover:text-bloomberg-text'
                              }`}
                            >
                              Close on Event Probability
                            </button>
                            <button
                              onClick={() => setConditionAction('reverse')}
                              className={`py-2 border text-[9px] font-bold transition-colors ${
                                conditionAction === 'reverse'
                                  ? 'bg-[#8B5CF6]/20 border-[#8B5CF6] text-[#8B5CF6]'
                                  : 'bg-bloomberg-bg border-terminal text-bloomberg-text-dim hover:text-bloomberg-text'
                              }`}
                            >
                              Reverse
                            </button>
                            <button
                              onClick={() => setConditionAction('increase')}
                              className={`py-2 border text-[9px] font-bold transition-colors ${
                                conditionAction === 'increase'
                                  ? 'bg-[#8B5CF6]/20 border-[#8B5CF6] text-[#8B5CF6]'
                                  : 'bg-bloomberg-bg border-terminal text-bloomberg-text-dim hover:text-bloomberg-text'
                              }`}
                            >
                              Increase Size
                            </button>
                            <button
                              onClick={() => setConditionAction('reduce')}
                              className={`py-2 border text-[9px] font-bold transition-colors ${
                                conditionAction === 'reduce'
                                  ? 'bg-[#8B5CF6]/20 border-[#8B5CF6] text-[#8B5CF6]'
                                  : 'bg-bloomberg-bg border-terminal text-bloomberg-text-dim hover:text-bloomberg-text'
                              }`}
                            >
                              Reduce Position
                            </button>
                          </div>
                          {(conditionAction === 'reduce' || conditionAction === 'increase') && (
                            <div className="mt-2">
                              <label className="text-bloomberg-text-dim text-[8px] block mb-1">
                                {conditionAction === 'increase' ? 'Increase by' : 'Reduce by'} Percentage
                              </label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="range"
                                  min="10"
                                  max={conditionAction === 'increase' ? '200' : '100'}
                                  step="10"
                                  value={partialClosePercent}
                                  onChange={(e) => setPartialClosePercent(Number(e.target.value))}
                                  className="flex-1"
                                />
                                <span className="text-bloomberg-text text-[9px] font-bold min-w-[40px]">{partialClosePercent}%</span>
                              </div>
                              {conditionAction === 'reduce' && (
                                <div className="text-bloomberg-text-dim text-[8px] mt-1">
                                  Use to take profit (when event likely) or stop loss (when event unlikely)
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Condition Type - Only Polymarket Events */}
                        <div>
                          <label className="text-bloomberg-text-dim text-[9px] uppercase mb-1 block">Event Condition</label>
                          <div className="bg-bloomberg-bg border border-[#8B5CF6]/30 p-2 text-center">
                            <div className="text-[#8B5CF6] text-[9px] font-bold">Polymarket Event-Based Automation</div>
                            <div className="text-bloomberg-text-dim text-[8px] mt-0.5">Select an event and set event probability</div>
                          </div>
                        </div>

                        {/* Event Selection */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-bloomberg-text-dim text-[9px] uppercase block">Select Event</label>
                            <button
                              onClick={() => {
                                setShowMarketsModal(true)
                                setShowPositionModal(false)
                              }}
                              className="text-[#8B5CF6] text-[8px] font-bold hover:underline"
                            >
                              Browse All Markets →
                            </button>
                          </div>
                          
                          {/* Search Input */}
                          <div className="mb-2">
                            <input
                              type="text"
                              value={eventSearchQuery}
                              onChange={(e) => setEventSearchQuery(e.target.value)}
                              placeholder="Search events or type event name..."
                              className="w-full bg-bloomberg-bg border border-terminal px-2 py-1.5 text-bloomberg-text text-[9px] outline-none focus:border-[#8B5CF6]"
                              autoFocus
                            />
                            <div className="text-bloomberg-text-dim text-[7px] mt-0.5">
                              {eventSearchQuery ? 'Filtering events...' : 'Type to search or browse all markets'}
                            </div>
                          </div>
                          
                          {/* Filtered Event List */}
                          <div className="max-h-60 overflow-y-auto border border-terminal bg-bloomberg-bg">
                            {(() => {
                              // Filter markets based on search query
                              const filteredMarkets = eventSearchQuery.trim()
                                ? polymarketMarkets.filter(m => 
                                    m.question.toLowerCase().includes(eventSearchQuery.toLowerCase()) ||
                                    m.category?.toLowerCase().includes(eventSearchQuery.toLowerCase())
                                  )
                                : polymarketMarkets.slice(0, 50) // Show top 50 by default
                              
                              // Check if search query doesn't match any market (for custom event names)
                              const hasCustomQuery = eventSearchQuery.trim() && filteredMarkets.length === 0
                              
                              if (hasCustomQuery) {
                                return (
                                  <div className="p-3 space-y-2">
                                    <div className="text-bloomberg-text-dim text-[9px] mb-2">
                                      No events found matching "{eventSearchQuery}"
                                    </div>
                                    <button
                                      onClick={() => {
                                        setSelectedPolymarketEvent(eventSearchQuery.trim())
                                        setEventSearchQuery('')
                                      }}
                                      className="w-full bg-[#8B5CF6]/20 border border-[#8B5CF6] text-[#8B5CF6] px-3 py-2 text-[9px] font-bold hover:bg-[#8B5CF6]/30 transition-colors"
                                    >
                                      Use "{eventSearchQuery.trim()}" as Event Name
                                    </button>
                                    <button
                                      onClick={() => {
                                        setShowMarketsModal(true)
                                        setShowPositionModal(false)
                                      }}
                                      className="w-full text-[#8B5CF6] text-[9px] font-bold hover:underline"
                                    >
                                      Or Browse All Markets →
                                    </button>
                                  </div>
                                )
                              }
                              
                              if (filteredMarkets.length === 0 && !eventSearchQuery.trim()) {
                                return (
                                  <div className="p-4 text-center text-bloomberg-text-dim text-[9px]">
                                    {loadingMarkets ? 'Loading markets...' : 'No markets available'}
                                  </div>
                                )
                              }
                              
                              return filteredMarkets.map((market) => (
                                <button
                                  key={market.id}
                                  onClick={() => {
                                    setSelectedPolymarketEvent(market.question)
                                    setEventSearchQuery('') // Clear search when selected
                                  }}
                                  className={`w-full text-left px-3 py-2 text-[9px] hover:bg-bloomberg-panel transition-colors border-b border-terminal last:border-b-0 ${
                                    selectedPolymarketEvent === market.question
                                      ? 'bg-[#8B5CF6]/20 text-[#8B5CF6] border-[#8B5CF6]/30'
                                      : 'text-bloomberg-text'
                                  }`}
                                >
                                  <div className="font-bold truncate">{market.question}</div>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <div className="text-bloomberg-text-dim text-[8px]">
                                      {market.currentProbability?.toFixed(1) || 'N/A'}%
                                    </div>
                                    <div className="text-bloomberg-text-dim text-[7px]">•</div>
                                    <div className="text-bloomberg-text-dim text-[8px]">
                                      {market.category || 'Uncategorized'}
                                    </div>
                                  </div>
                                </button>
                              ))
                            })()}
                          </div>
                          
                          {polymarketMarkets.length === 0 && !loadingMarkets && (
                            <div className="p-3 text-center text-bloomberg-text-dim text-[9px] border border-terminal mt-2">
                              No markets available. <button
                                onClick={() => {
                                  setShowMarketsModal(true)
                                  setShowPositionModal(false)
                                }}
                                className="text-[#8B5CF6] font-bold hover:underline"
                              >
                                Browse Markets
                              </button>
                            </div>
                          )}
                          
                          {loadingMarkets && (
                            <div className="p-3 text-center text-bloomberg-text-dim text-[9px] border border-terminal mt-2">
                              Loading markets...
                            </div>
                          )}
                          
                          {selectedPolymarketEvent && (
                            <div className="mt-2 space-y-2">
                              <div>
                                <label className="text-bloomberg-text-dim text-[9px] uppercase mb-1 block">Event Probability (%)</label>
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={conditionThreshold}
                                  onChange={(e) => setConditionThreshold(e.target.value)}
                                  placeholder="75"
                                  className="w-full bg-bloomberg-bg border border-terminal px-2 py-1 text-bloomberg-text text-[10px] outline-none"
                                />
                              </div>
                              <div className="text-bloomberg-text-dim text-[8px]">
                                Set event probability to close when likely (take profit) or unlikely (cut losses)
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Additional Conditions Section */}
                        <div className="space-y-3 pt-2 border-t border-terminal/50">
                          <div className="text-bloomberg-text-dim text-[9px] uppercase mb-2">Additional Conditions (Optional)</div>
                          
                          {/* Price Condition */}
                          <div>
                            <button
                              onClick={() => {
                                setBuilderConditionPrice(prev => ({
                                  ...prev,
                                  enabled: !prev.enabled
                                }))
                              }}
                              className={`w-full text-left px-2 py-1.5 text-[9px] border transition-colors ${
                                builderConditionPrice.enabled
                                  ? 'bg-[#8B5CF6]/20 border-[#8B5CF6] text-bloomberg-text'
                                  : 'bg-bloomberg-bg border-terminal text-bloomberg-text-dim hover:border-[#8B5CF6]'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span>Price Condition</span>
                                <span className="text-[7px]">{builderConditionPrice.enabled ? '▼' : '▶'}</span>
                              </div>
                            </button>
                            {builderConditionPrice.enabled && (
                              <div className="mt-1.5 p-2 bg-bloomberg-bg border border-terminal">
                                <div className="flex items-center gap-2 mb-2">
                                  <button
                                    onClick={() => setBuilderConditionPrice(prev => ({
                                      ...prev,
                                      type: 'above'
                                    }))}
                                    className={`px-2 py-1 text-[8px] border transition-colors ${
                                      builderConditionPrice.type === 'above'
                                        ? 'bg-[#8B5CF6]/20 border-[#8B5CF6] text-bloomberg-text'
                                        : 'bg-bloomberg-bg border-terminal text-bloomberg-text-dim'
                                    }`}
                                  >
                                    Above
                                  </button>
                                  <button
                                    onClick={() => setBuilderConditionPrice(prev => ({
                                      ...prev,
                                      type: 'below'
                                    }))}
                                    className={`px-2 py-1 text-[8px] border transition-colors ${
                                      builderConditionPrice.type === 'below'
                                        ? 'bg-[#8B5CF6]/20 border-[#8B5CF6] text-bloomberg-text'
                                        : 'bg-bloomberg-bg border-terminal text-bloomberg-text-dim'
                                    }`}
                                  >
                                    Below
                                  </button>
                                </div>
                                <input
                                  type="text"
                                  placeholder="$3500"
                                  value={builderConditionPrice.value}
                                  onChange={(e) => setBuilderConditionPrice(prev => ({
                                    ...prev,
                                    value: e.target.value
                                  }))}
                                  className="w-full bg-transparent border border-terminal px-2 py-1 text-[9px] text-bloomberg-text outline-none focus:border-[#8B5CF6]"
                                />
                              </div>
                            )}
                          </div>

                          {/* Open Interest Condition */}
                          <div>
                            <button
                              onClick={() => {
                                setBuilderConditionOI(prev => ({
                                  ...prev,
                                  enabled: !prev.enabled
                                }))
                              }}
                              className={`w-full text-left px-2 py-1.5 text-[9px] border transition-colors ${
                                builderConditionOI.enabled
                                  ? 'bg-[#8B5CF6]/20 border-[#8B5CF6] text-bloomberg-text'
                                  : 'bg-bloomberg-bg border-terminal text-bloomberg-text-dim hover:border-[#8B5CF6]'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span>Open Interest (OI) Condition</span>
                                <span className="text-[7px]">{builderConditionOI.enabled ? '▼' : '▶'}</span>
                              </div>
                            </button>
                            {builderConditionOI.enabled && (
                              <div className="mt-1.5 p-2 bg-bloomberg-bg border border-terminal">
                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                  <button
                                    onClick={() => setBuilderConditionOI(prev => ({
                                      ...prev,
                                      type: 'rises'
                                    }))}
                                    className={`px-2 py-1 text-[8px] border transition-colors ${
                                      builderConditionOI.type === 'rises'
                                        ? 'bg-[#8B5CF6]/20 border-[#8B5CF6] text-bloomberg-text'
                                        : 'bg-bloomberg-bg border-terminal text-bloomberg-text-dim'
                                    }`}
                                  >
                                    Rises
                                  </button>
                                  <button
                                    onClick={() => setBuilderConditionOI(prev => ({
                                      ...prev,
                                      type: 'falls'
                                    }))}
                                    className={`px-2 py-1 text-[8px] border transition-colors ${
                                      builderConditionOI.type === 'falls'
                                        ? 'bg-[#8B5CF6]/20 border-[#8B5CF6] text-bloomberg-text'
                                        : 'bg-bloomberg-bg border-terminal text-bloomberg-text-dim'
                                    }`}
                                  >
                                    Falls
                                  </button>
                                  <button
                                    onClick={() => setBuilderConditionOI(prev => ({
                                      ...prev,
                                      type: 'above'
                                    }))}
                                    className={`px-2 py-1 text-[8px] border transition-colors ${
                                      builderConditionOI.type === 'above'
                                        ? 'bg-[#8B5CF6]/20 border-[#8B5CF6] text-bloomberg-text'
                                        : 'bg-bloomberg-bg border-terminal text-bloomberg-text-dim'
                                    }`}
                                  >
                                    Above
                                  </button>
                                  <button
                                    onClick={() => setBuilderConditionOI(prev => ({
                                      ...prev,
                                      type: 'below'
                                    }))}
                                    className={`px-2 py-1 text-[8px] border transition-colors ${
                                      builderConditionOI.type === 'below'
                                        ? 'bg-[#8B5CF6]/20 border-[#8B5CF6] text-bloomberg-text'
                                        : 'bg-bloomberg-bg border-terminal text-bloomberg-text-dim'
                                    }`}
                                  >
                                    Below
                                  </button>
                                </div>
                                <div className="flex gap-2 mb-2">
                                  <input
                                    type="text"
                                    placeholder={builderConditionOI.type === 'rises' || builderConditionOI.type === 'falls' ? '5%' : '$2.2B'}
                                    value={builderConditionOI.value}
                                    onChange={(e) => setBuilderConditionOI(prev => ({
                                      ...prev,
                                      value: e.target.value
                                    }))}
                                    className="flex-1 bg-transparent border border-terminal px-2 py-1 text-[9px] text-bloomberg-text outline-none focus:border-[#8B5CF6]"
                                  />
                                  {(builderConditionOI.type === 'rises' || builderConditionOI.type === 'falls') && (
                                    <select
                                      value={builderConditionOI.timeframe || '24h'}
                                      onChange={(e) => setBuilderConditionOI(prev => ({
                                        ...prev,
                                        timeframe: e.target.value
                                      }))}
                                      className="bg-transparent border border-terminal px-2 py-1 text-[9px] text-bloomberg-text outline-none focus:border-[#8B5CF6]"
                                    >
                                      <option value="1h">1h</option>
                                      <option value="24h">24h</option>
                                      <option value="7d">7d</option>
                                    </select>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Funding Rate Condition */}
                          <div>
                            <button
                              onClick={() => {
                                setBuilderConditionFunding(prev => ({
                                  ...prev,
                                  enabled: !prev.enabled
                                }))
                              }}
                              className={`w-full text-left px-2 py-1.5 text-[9px] border transition-colors ${
                                builderConditionFunding.enabled
                                  ? 'bg-[#8B5CF6]/20 border-[#8B5CF6] text-bloomberg-text'
                                  : 'bg-bloomberg-bg border-terminal text-bloomberg-text-dim hover:border-[#8B5CF6]'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span>Funding Rate Condition</span>
                                <span className="text-[7px]">{builderConditionFunding.enabled ? '▼' : '▶'}</span>
                              </div>
                            </button>
                            {builderConditionFunding.enabled && (
                              <div className="mt-1.5 p-2 bg-bloomberg-bg border border-terminal">
                                <div className="flex items-center gap-2 mb-2">
                                  <button
                                    onClick={() => setBuilderConditionFunding(prev => ({
                                      ...prev,
                                      type: 'above'
                                    }))}
                                    className={`px-2 py-1 text-[8px] border transition-colors ${
                                      builderConditionFunding.type === 'above'
                                        ? 'bg-[#8B5CF6]/20 border-[#8B5CF6] text-bloomberg-text'
                                        : 'bg-bloomberg-bg border-terminal text-bloomberg-text-dim'
                                    }`}
                                  >
                                    Above
                                  </button>
                                  <button
                                    onClick={() => setBuilderConditionFunding(prev => ({
                                      ...prev,
                                      type: 'below'
                                    }))}
                                    className={`px-2 py-1 text-[8px] border transition-colors ${
                                      builderConditionFunding.type === 'below'
                                        ? 'bg-[#8B5CF6]/20 border-[#8B5CF6] text-bloomberg-text'
                                        : 'bg-bloomberg-bg border-terminal text-bloomberg-text-dim'
                                    }`}
                                  >
                                    Below
                                  </button>
                                </div>
                                <input
                                  type="text"
                                  placeholder="0.01%"
                                  value={builderConditionFunding.value}
                                  onChange={(e) => setBuilderConditionFunding(prev => ({
                                    ...prev,
                                    value: e.target.value
                                  }))}
                                  className="w-full bg-transparent border border-terminal px-2 py-1 text-[9px] text-bloomberg-text outline-none focus:border-[#8B5CF6]"
                                />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Build Command Button with Enhanced Validation */}
                        <div className="space-y-2">
                          {(!selectedPolymarketEvent || !conditionThreshold) && (
                            <div className="bg-bloomberg-panel border border-terminal p-2">
                              <div className="text-bloomberg-text-dim text-[8px] space-y-1">
                                {!selectedPolymarketEvent && (
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-bloomberg-red">●</span>
                                    <span>Select a Polymarket event above</span>
                                  </div>
                                )}
                                {selectedPolymarketEvent && !conditionThreshold && (
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-bloomberg-red">●</span>
                                    <span>Enter probability threshold (0-100%)</span>
                                  </div>
                                )}
                                {selectedPolymarketEvent && conditionThreshold && (
                                  <div className="flex items-center gap-1.5 text-bloomberg-green">
                                    <span>✓</span>
                                    <span>All required fields completed</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          <button
                            onClick={() => {
                              if (!selectedPolymarketEvent || !conditionThreshold) return
                              
                              const thresholdNum = parseFloat(conditionThreshold)
                              if (isNaN(thresholdNum) || thresholdNum < 0 || thresholdNum > 100) {
                                return
                              }

                              let command = ''
                              if (conditionAction === 'reduce') {
                                command = `Reduce ${selectedPosition.asset} ${selectedPosition.direction.toLowerCase()} position ${selectedPosition.id} by ${partialClosePercent}% if Polymarket "${selectedPolymarketEvent}" probability ≥ ${thresholdNum}%`
                              } else if (conditionAction === 'reverse') {
                                command = `Reverse ${selectedPosition.asset} position ${selectedPosition.id} when Polymarket "${selectedPolymarketEvent}" probability ≥ ${thresholdNum}%`
                              } else if (conditionAction === 'increase') {
                                command = `Increase ${selectedPosition.asset} ${selectedPosition.direction.toLowerCase()} position ${selectedPosition.id} by ${partialClosePercent}% if Polymarket "${selectedPolymarketEvent}" probability ≥ ${thresholdNum}%`
                              } else {
                                command = `Close ${selectedPosition.asset} ${selectedPosition.direction.toLowerCase()} position ${selectedPosition.id} if Polymarket "${selectedPolymarketEvent}" probability ≥ ${thresholdNum}%`
                              }

                              // Add additional conditions
                              const conditions: string[] = []
                              if (builderConditionPrice.enabled && builderConditionPrice.value) {
                                conditions.push(`price ${builderConditionPrice.type} ${builderConditionPrice.value}`)
                              }
                              if (builderConditionOI.enabled && builderConditionOI.value) {
                                if (builderConditionOI.type === 'rises') {
                                  conditions.push(`OI rises ${builderConditionOI.value} over ${builderConditionOI.timeframe || '24h'}`)
                                } else if (builderConditionOI.type === 'falls') {
                                  conditions.push(`OI falls ${builderConditionOI.value} over ${builderConditionOI.timeframe || '24h'}`)
                                } else {
                                  conditions.push(`OI ${builderConditionOI.type} ${builderConditionOI.value}`)
                                }
                              }
                              if (builderConditionFunding.enabled && builderConditionFunding.value) {
                                conditions.push(`funding rate ${builderConditionFunding.type} ${builderConditionFunding.value}`)
                              }
                              
                              if (conditions.length > 0) {
                                command = command.replace('if ', 'if ').replace('when ', 'when ')
                                if (command.includes('probability ≥')) {
                                  command = command.replace(/(probability ≥ \d+%)/, `$1 AND ${conditions.join(' AND ')}`)
                                } else {
                                  command += ` AND ${conditions.join(' AND ')}`
                                }
                              }

                              setInput(command)
                              setShowPositionModal(false)
                              setSelectedPosition(null)
                              setShowConditionBuilder(false)
                              setEventSearchQuery('')
                              setBuilderConditionPrice({ enabled: false, type: 'above', value: '' })
                              setBuilderConditionOI({ enabled: false, type: 'rises', value: '', timeframe: '24h' })
                              setBuilderConditionFunding({ enabled: false, type: 'above', value: '' })
                              setTimeout(() => inputRef.current?.focus(), 100)
                            }}
                            disabled={!selectedPolymarketEvent || !conditionThreshold || isNaN(parseFloat(conditionThreshold)) || parseFloat(conditionThreshold) < 0 || parseFloat(conditionThreshold) > 100}
                            className={`w-full py-2.5 font-bold text-[10px] uppercase transition-colors ${
                              !selectedPolymarketEvent || !conditionThreshold || isNaN(parseFloat(conditionThreshold)) || parseFloat(conditionThreshold) < 0 || parseFloat(conditionThreshold) > 100
                                ? 'bg-bloomberg-text-dim/20 text-bloomberg-text-dim cursor-not-allowed'
                                : 'bg-[#8B5CF6] hover:bg-[#7C3AED] text-bloomberg-bg'
                            }`}
                          >
                            Create Event-Aware Automation
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-bloomberg-text text-xs font-bold">
                        Event-Aware Quick Actions
                      </h4>
                      <span className="text-bloomberg-text-dim text-[8px]">
                        {showConditionBuilder ? 'Info: Use builder below' : 'Click to add base condition'}
                      </span>
                    </div>
                    {!selectedQuickAction ? (
                      <div className="grid grid-cols-2 gap-2">
                        {showConditionBuilder ? (
                          <>
                            <div className="bg-bloomberg-bg/50 border border-terminal/50 px-3 py-2 text-left opacity-75 cursor-not-allowed">
                              <div className="flex items-center gap-2 mb-1">
                                <div className="text-bloomberg-text-dim text-[10px] font-bold">Close on Event Probability</div>
                              </div>
                              <div className="text-bloomberg-text-dim text-[9px]">
                                Close position when event probability reaches target - take profit when likely or cut losses when unlikely
                              </div>
                            </div>
                            <div className="bg-bloomberg-bg/50 border border-terminal/50 px-3 py-2 text-left opacity-75 cursor-not-allowed">
                              <div className="flex items-center gap-2 mb-1">
                                <div className="text-bloomberg-text-dim text-[10px] font-bold">Reverse on Event</div>
                              </div>
                              <div className="text-bloomberg-text-dim text-[9px]">
                                Flip direction when event probability triggers
                              </div>
                            </div>
                            <div className="bg-bloomberg-bg/50 border border-terminal/50 px-3 py-2 text-left opacity-75 cursor-not-allowed">
                              <div className="flex items-center gap-2 mb-1">
                                <div className="text-bloomberg-text-dim text-[10px] font-bold">Increase Position on Event</div>
                              </div>
                              <div className="text-bloomberg-text-dim text-[9px]">
                                Add to position when event probability reaches threshold
                              </div>
                            </div>
                            <div className="bg-bloomberg-bg/50 border border-terminal/50 px-3 py-2 text-left opacity-75 cursor-not-allowed">
                              <div className="flex items-center gap-2 mb-1">
                                <div className="text-bloomberg-text-dim text-[10px] font-bold">Reduce Position on Event</div>
                              </div>
                              <div className="text-bloomberg-text-dim text-[9px]">
                                Reduce position size - use to take profit when event likely or stop loss when unlikely
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                setSelectedQuickAction({
                                  type: 'close',
                                  baseCommand: `Close ${selectedPosition.asset} ${selectedPosition.direction.toLowerCase()} position ${selectedPosition.id} if Polymarket "Event" probability ≥ 75%`
                                })
                                setAdditionalConditions({})
                              }}
                              className="bg-bloomberg-bg border border-terminal px-3 py-2 text-left hover:border-[#8B5CF6] transition-colors group"
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <div className="text-bloomberg-text text-[10px] font-bold">Close on Event Probability</div>
                                <span className="text-[#8B5CF6] text-[7px] font-bold opacity-0 group-hover:opacity-100 transition-opacity">+ Add more</span>
                              </div>
                              <div className="text-bloomberg-text-dim text-[9px]">
                                Close position when event probability reaches target - take profit when likely or cut losses when unlikely
                              </div>
                            </button>
                            <button
                              onClick={() => {
                                setSelectedQuickAction({
                                  type: 'reverse',
                                  baseCommand: `Reverse ${selectedPosition.asset} position ${selectedPosition.id} when Polymarket "Event" probability ≥ 70%`
                                })
                                setAdditionalConditions({})
                              }}
                              className="bg-bloomberg-bg border border-terminal px-3 py-2 text-left hover:border-[#8B5CF6] transition-colors group"
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <div className="text-bloomberg-text text-[10px] font-bold">Reverse on Event</div>
                                <span className="text-[#8B5CF6] text-[7px] font-bold opacity-0 group-hover:opacity-100 transition-opacity">+ Add more</span>
                              </div>
                              <div className="text-bloomberg-text-dim text-[9px]">
                                Flip direction when event probability triggers
                              </div>
                            </button>
                            <button
                              onClick={() => {
                                setSelectedQuickAction({
                                  type: 'increase',
                                  baseCommand: `Increase ${selectedPosition.asset} ${selectedPosition.direction.toLowerCase()} position ${selectedPosition.id} by 50% if Polymarket "Event" probability ≥ 75%`
                                })
                                setAdditionalConditions({})
                              }}
                              className="bg-bloomberg-bg border border-terminal px-3 py-2 text-left hover:border-[#8B5CF6] transition-colors group"
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <div className="text-bloomberg-text text-[10px] font-bold">Increase Position on Event</div>
                                <span className="text-[#8B5CF6] text-[7px] font-bold opacity-0 group-hover:opacity-100 transition-opacity">+ Add more</span>
                              </div>
                              <div className="text-bloomberg-text-dim text-[9px]">
                                Add to position when event probability reaches threshold
                              </div>
                            </button>
                            <button
                              onClick={() => {
                                setSelectedQuickAction({
                                  type: 'reduce',
                                  baseCommand: `Reduce ${selectedPosition.asset} ${selectedPosition.direction.toLowerCase()} position ${selectedPosition.id} by 50% if Polymarket "Event" probability ≥ 75%`
                                })
                                setAdditionalConditions({})
                              }}
                              className="bg-bloomberg-bg border border-terminal px-3 py-2 text-left hover:border-[#8B5CF6] transition-colors group"
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <div className="text-bloomberg-text text-[10px] font-bold">Reduce Position on Event</div>
                                <span className="text-[#8B5CF6] text-[7px] font-bold opacity-0 group-hover:opacity-100 transition-opacity">+ Add more</span>
                              </div>
                              <div className="text-bloomberg-text-dim text-[9px]">
                                Reduce position size - use to take profit when event likely or stop loss when unlikely
                              </div>
                            </button>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="p-3 bg-bloomberg-panel border border-[#8B5CF6]/30">
                          <div className="flex items-center justify-between mb-3">
                            <div className="text-bloomberg-text text-[10px] font-bold">
                              Selected: {selectedQuickAction.type === 'close' ? 'Close on Event' : selectedQuickAction.type === 'reverse' ? 'Reverse on Event' : selectedQuickAction.type === 'increase' ? 'Increase Position on Event' : 'Reduce Position on Event'}
                            </div>
                            <button
                              onClick={() => {
                                setSelectedQuickAction(null)
                                setAdditionalConditions({})
                              }}
                              className="text-bloomberg-text-dim hover:text-bloomberg-text text-[8px]"
                            >
                              Change
                            </button>
                          </div>
                          <div className="text-bloomberg-text-dim text-[9px] mb-3">
                            Add additional conditions (optional):
                          </div>
                          
                          {/* Price Condition */}
                          <div className="mb-2">
                            <button
                              onClick={() => {
                                setAdditionalConditions(prev => ({
                                  ...prev,
                                  price: prev.price?.enabled ? { ...prev.price, enabled: false } : { enabled: true, type: 'above', value: '' }
                                }))
                              }}
                              className={`w-full text-left px-2 py-1.5 text-[9px] border transition-colors ${
                                additionalConditions.price?.enabled
                                  ? 'bg-[#8B5CF6]/20 border-[#8B5CF6] text-bloomberg-text'
                                  : 'bg-bloomberg-bg border-terminal text-bloomberg-text-dim hover:border-[#8B5CF6]'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span>Price Condition</span>
                                <span className="text-[7px]">{additionalConditions.price?.enabled ? '▼' : '▶'}</span>
                              </div>
                            </button>
                            {additionalConditions.price?.enabled && (
                              <div className="mt-1.5 p-2 bg-bloomberg-bg border border-terminal">
                                <div className="flex items-center gap-2 mb-2">
                                  <button
                                    onClick={() => setAdditionalConditions(prev => ({
                                      ...prev,
                                      price: prev.price ? { ...prev.price, type: 'above' } : undefined
                                    }))}
                                    className={`px-2 py-1 text-[8px] border transition-colors ${
                                      additionalConditions.price?.type === 'above'
                                        ? 'bg-[#8B5CF6]/20 border-[#8B5CF6] text-bloomberg-text'
                                        : 'bg-bloomberg-bg border-terminal text-bloomberg-text-dim'
                                    }`}
                                  >
                                    Above
                                  </button>
                                  <button
                                    onClick={() => setAdditionalConditions(prev => ({
                                      ...prev,
                                      price: prev.price ? { ...prev.price, type: 'below' } : undefined
                                    }))}
                                    className={`px-2 py-1 text-[8px] border transition-colors ${
                                      additionalConditions.price?.type === 'below'
                                        ? 'bg-[#8B5CF6]/20 border-[#8B5CF6] text-bloomberg-text'
                                        : 'bg-bloomberg-bg border-terminal text-bloomberg-text-dim'
                                    }`}
                                  >
                                    Below
                                  </button>
                                </div>
                                <input
                                  type="text"
                                  placeholder="$3500"
                                  value={additionalConditions.price?.value || ''}
                                  onChange={(e) => setAdditionalConditions(prev => ({
                                    ...prev,
                                    price: prev.price ? { ...prev.price, value: e.target.value } : { enabled: true, type: 'above', value: e.target.value }
                                  }))}
                                  className="w-full bg-transparent border border-terminal px-2 py-1 text-[9px] text-bloomberg-text outline-none focus:border-[#8B5CF6]"
                                />
                              </div>
                            )}
                          </div>

                          {/* OI Condition */}
                          <div className="mb-2">
                            <button
                              onClick={() => {
                                setAdditionalConditions(prev => ({
                                  ...prev,
                                  oi: prev.oi?.enabled ? { ...prev.oi, enabled: false } : { enabled: true, type: 'rises', value: '', timeframe: '24h' }
                                }))
                              }}
                              className={`w-full text-left px-2 py-1.5 text-[9px] border transition-colors ${
                                additionalConditions.oi?.enabled
                                  ? 'bg-[#8B5CF6]/20 border-[#8B5CF6] text-bloomberg-text'
                                  : 'bg-bloomberg-bg border-terminal text-bloomberg-text-dim hover:border-[#8B5CF6]'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span>Open Interest (OI) Condition</span>
                                <span className="text-[7px]">{additionalConditions.oi?.enabled ? '▼' : '▶'}</span>
                              </div>
                            </button>
                            {additionalConditions.oi?.enabled && (
                              <div className="mt-1.5 p-2 bg-bloomberg-bg border border-terminal">
                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                  <button
                                    onClick={() => setAdditionalConditions(prev => ({
                                      ...prev,
                                      oi: prev.oi ? { ...prev.oi, type: 'rises' } : undefined
                                    }))}
                                    className={`px-2 py-1 text-[8px] border transition-colors ${
                                      additionalConditions.oi?.type === 'rises'
                                        ? 'bg-[#8B5CF6]/20 border-[#8B5CF6] text-bloomberg-text'
                                        : 'bg-bloomberg-bg border-terminal text-bloomberg-text-dim'
                                    }`}
                                  >
                                    Rises
                                  </button>
                                  <button
                                    onClick={() => setAdditionalConditions(prev => ({
                                      ...prev,
                                      oi: prev.oi ? { ...prev.oi, type: 'falls' } : undefined
                                    }))}
                                    className={`px-2 py-1 text-[8px] border transition-colors ${
                                      additionalConditions.oi?.type === 'falls'
                                        ? 'bg-[#8B5CF6]/20 border-[#8B5CF6] text-bloomberg-text'
                                        : 'bg-bloomberg-bg border-terminal text-bloomberg-text-dim'
                                    }`}
                                  >
                                    Falls
                                  </button>
                                  <button
                                    onClick={() => setAdditionalConditions(prev => ({
                                      ...prev,
                                      oi: prev.oi ? { ...prev.oi, type: 'above' } : undefined
                                    }))}
                                    className={`px-2 py-1 text-[8px] border transition-colors ${
                                      additionalConditions.oi?.type === 'above'
                                        ? 'bg-[#8B5CF6]/20 border-[#8B5CF6] text-bloomberg-text'
                                        : 'bg-bloomberg-bg border-terminal text-bloomberg-text-dim'
                                    }`}
                                  >
                                    Above
                                  </button>
                                  <button
                                    onClick={() => setAdditionalConditions(prev => ({
                                      ...prev,
                                      oi: prev.oi ? { ...prev.oi, type: 'below' } : undefined
                                    }))}
                                    className={`px-2 py-1 text-[8px] border transition-colors ${
                                      additionalConditions.oi?.type === 'below'
                                        ? 'bg-[#8B5CF6]/20 border-[#8B5CF6] text-bloomberg-text'
                                        : 'bg-bloomberg-bg border-terminal text-bloomberg-text-dim'
                                    }`}
                                  >
                                    Below
                                  </button>
                                </div>
                                <div className="flex gap-2 mb-2">
                                  <input
                                    type="text"
                                    placeholder="5%"
                                    value={additionalConditions.oi?.value || ''}
                                    onChange={(e) => setAdditionalConditions(prev => ({
                                      ...prev,
                                      oi: prev.oi ? { ...prev.oi, value: e.target.value } : { enabled: true, type: 'rises', value: e.target.value, timeframe: '24h' }
                                    }))}
                                    className="flex-1 bg-transparent border border-terminal px-2 py-1 text-[9px] text-bloomberg-text outline-none focus:border-[#8B5CF6]"
                                  />
                                  {(additionalConditions.oi?.type === 'rises' || additionalConditions.oi?.type === 'falls') && (
                                    <select
                                      value={additionalConditions.oi?.timeframe || '24h'}
                                      onChange={(e) => setAdditionalConditions(prev => ({
                                        ...prev,
                                        oi: prev.oi ? { ...prev.oi, timeframe: e.target.value } : undefined
                                      }))}
                                      className="bg-transparent border border-terminal px-2 py-1 text-[9px] text-bloomberg-text outline-none focus:border-[#8B5CF6]"
                                    >
                                      <option value="1h">1h</option>
                                      <option value="24h">24h</option>
                                      <option value="7d">7d</option>
                                    </select>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Funding Condition */}
                          <div className="mb-2">
                            <button
                              onClick={() => {
                                setAdditionalConditions(prev => ({
                                  ...prev,
                                  funding: prev.funding?.enabled ? { ...prev.funding, enabled: false } : { enabled: true, type: 'above', value: '' }
                                }))
                              }}
                              className={`w-full text-left px-2 py-1.5 text-[9px] border transition-colors ${
                                additionalConditions.funding?.enabled
                                  ? 'bg-[#8B5CF6]/20 border-[#8B5CF6] text-bloomberg-text'
                                  : 'bg-bloomberg-bg border-terminal text-bloomberg-text-dim hover:border-[#8B5CF6]'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span>Funding Rate Condition</span>
                                <span className="text-[7px]">{additionalConditions.funding?.enabled ? '▼' : '▶'}</span>
                              </div>
                            </button>
                            {additionalConditions.funding?.enabled && (
                              <div className="mt-1.5 p-2 bg-bloomberg-bg border border-terminal">
                                <div className="flex items-center gap-2 mb-2">
                                  <button
                                    onClick={() => setAdditionalConditions(prev => ({
                                      ...prev,
                                      funding: prev.funding ? { ...prev.funding, type: 'above' } : undefined
                                    }))}
                                    className={`px-2 py-1 text-[8px] border transition-colors ${
                                      additionalConditions.funding?.type === 'above'
                                        ? 'bg-[#8B5CF6]/20 border-[#8B5CF6] text-bloomberg-text'
                                        : 'bg-bloomberg-bg border-terminal text-bloomberg-text-dim'
                                    }`}
                                  >
                                    Above
                                  </button>
                                  <button
                                    onClick={() => setAdditionalConditions(prev => ({
                                      ...prev,
                                      funding: prev.funding ? { ...prev.funding, type: 'below' } : undefined
                                    }))}
                                    className={`px-2 py-1 text-[8px] border transition-colors ${
                                      additionalConditions.funding?.type === 'below'
                                        ? 'bg-[#8B5CF6]/20 border-[#8B5CF6] text-bloomberg-text'
                                        : 'bg-bloomberg-bg border-terminal text-bloomberg-text-dim'
                                    }`}
                                  >
                                    Below
                                  </button>
                                </div>
                                <input
                                  type="text"
                                  placeholder="0.01%"
                                  value={additionalConditions.funding?.value || ''}
                                  onChange={(e) => setAdditionalConditions(prev => ({
                                    ...prev,
                                    funding: prev.funding ? { ...prev.funding, value: e.target.value } : { enabled: true, type: 'above', value: e.target.value }
                                  }))}
                                  className="w-full bg-transparent border border-terminal px-2 py-1 text-[9px] text-bloomberg-text outline-none focus:border-[#8B5CF6]"
                                />
                              </div>
                            )}
                          </div>

                          <div className="flex gap-2 mt-3 pt-3 border-t border-terminal/50">
                            <button
                              onClick={() => {
                                // Build the final command
                                let command = selectedQuickAction.baseCommand
                                const conditions: string[] = []
                                
                                if (additionalConditions.price?.enabled && additionalConditions.price.value) {
                                  conditions.push(`price ${additionalConditions.price.type} ${additionalConditions.price.value}`)
                                }
                                if (additionalConditions.oi?.enabled && additionalConditions.oi.value) {
                                  if (additionalConditions.oi.type === 'rises') {
                                    conditions.push(`OI rises ${additionalConditions.oi.value} over ${additionalConditions.oi.timeframe || '24h'}`)
                                  } else if (additionalConditions.oi.type === 'falls') {
                                    conditions.push(`OI falls ${additionalConditions.oi.value} over ${additionalConditions.oi.timeframe || '24h'}`)
                                  } else {
                                    conditions.push(`OI ${additionalConditions.oi.type} ${additionalConditions.oi.value}`)
                                  }
                                }
                                if (additionalConditions.funding?.enabled && additionalConditions.funding.value) {
                                  conditions.push(`funding rate ${additionalConditions.funding.type} ${additionalConditions.funding.value}`)
                                }
                                
                                if (conditions.length > 0) {
                                  command = command.replace('if ', 'if ').replace('when ', 'when ')
                                  // Replace the last part to add AND conditions
                                  if (command.includes('probability ≥')) {
                                    command = command.replace(/(probability ≥ \d+%)/, `$1 AND ${conditions.join(' AND ')}`)
                                  } else {
                                    command += ` AND ${conditions.join(' AND ')}`
                                  }
                                }
                                
                                setInput(command)
                                setShowPositionModal(false)
                                setSelectedPosition(null)
                                setSelectedQuickAction(null)
                                setAdditionalConditions({})
                                setTimeout(() => inputRef.current?.focus(), 100)
                              }}
                              className="flex-1 bg-[#8B5CF6] hover:bg-[#8B5CF6]/80 text-bloomberg-bg px-3 py-2 text-[10px] font-bold transition-colors"
                            >
                              Create Automation
                            </button>
                            <button
                              onClick={() => {
                                setInput(selectedQuickAction.baseCommand)
                                setShowPositionModal(false)
                                setSelectedPosition(null)
                                setSelectedQuickAction(null)
                                setAdditionalConditions({})
                                setTimeout(() => inputRef.current?.focus(), 100)
                              }}
                              className="px-3 py-2 bg-bloomberg-bg border border-terminal text-bloomberg-text text-[10px] font-bold hover:border-[#8B5CF6] transition-colors"
                            >
                              Skip
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Multiple Conditions Prompt */}
                    <div className="mt-3 p-3 bg-bloomberg-panel border border-[#8B5CF6]/30">
                      <div className="flex items-start gap-2 mb-2">
                        <div className="text-[#8B5CF6] text-[10px] font-bold mt-0.5">💡</div>
                        <div className="flex-1">
                          <div className="text-bloomberg-text text-[10px] font-bold mb-1">
                            Add Multiple Conditions
                          </div>
                          <div className="text-bloomberg-text-dim text-[9px] mb-2">
                            Combine multiple triggers for more sophisticated automations. After selecting a base condition above, you can add additional conditions in the terminal.
                          </div>
                          <div className="space-y-1.5">
                            <div className="text-bloomberg-text-dim text-[8px] font-mono">
                              <span className="text-bloomberg-green">Example:</span> Close position if Polymarket "Event" probability ≥ 75% <span className="text-[#8B5CF6]">AND</span> price above $3500
                            </div>
                            <div className="text-bloomberg-text-dim text-[8px] font-mono">
                              <span className="text-bloomberg-green">Example:</span> Close position if Polymarket "Event A" probability ≥ 70% <span className="text-[#8B5CF6]">OR</span> Polymarket "Event B" probability ≥ 80%
                            </div>
                            <div className="text-bloomberg-text-dim text-[8px] font-mono">
                              <span className="text-bloomberg-green">Example:</span> Close position if Polymarket "Event" probability ≥ 75% <span className="text-[#8B5CF6]">AND</span> OI rises 5% over 24h
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 pt-2 border-t border-terminal/50">
                        <div className="flex items-center gap-2 text-bloomberg-text-dim text-[8px]">
                          <span className="text-bloomberg-orange">Tip:</span>
                          <span>After clicking a quick action, edit the command in the terminal to add "and [condition]" or "or [condition]"</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Close Button */}
                  <div className="mb-4 p-3 bg-bloomberg-red/10 border border-bloomberg-red/30">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-bloomberg-text text-[10px] font-bold mb-1">Immediate Close</div>
                        <div className="text-bloomberg-text-dim text-[9px]">
                          Close position immediately at market price
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setInput(`Close ${selectedPosition.asset} ${selectedPosition.direction.toLowerCase()} position ${selectedPosition.id} immediately`)
                          setShowPositionModal(false)
                          setSelectedPosition(null)
                          setTimeout(() => inputRef.current?.focus(), 100)
                        }}
                        className="bg-bloomberg-red hover:bg-bloomberg-red/80 text-bloomberg-bg px-4 py-2 text-[10px] font-bold transition-colors"
                      >
                        CLOSE NOW
                      </button>
                    </div>
                  </div>

                  {selectedPosition.exitConditions && selectedPosition.exitConditions.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-bloomberg-text text-xs font-bold mb-2">
                        Active Exit Conditions ({selectedPosition.exitConditions.length})
                      </h4>
                      <div className="space-y-2">
                        {selectedPosition.exitConditions.map((condition, idx) => (
                          <div key={idx} className="bg-bloomberg-bg border border-terminal px-3 py-2 flex items-center justify-between group">
                            <div className="flex-1">
                              <div className="text-bloomberg-text text-[10px]">{condition.description}</div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`text-[8px] font-bold px-1.5 py-0.5 ${
                                  condition.status === 'PENDING' 
                                    ? 'bg-bloomberg-green/20 text-bloomberg-green'
                                    : condition.status === 'TRIGGERED'
                                    ? 'bg-bloomberg-orange/20 text-bloomberg-orange'
                                    : 'bg-bloomberg-text-dim/20 text-bloomberg-text-dim'
                                }`}>
                                  {condition.status}
                                </span>
                                <span className="text-bloomberg-text-dim text-[8px]">
                                  {condition.type}
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                setInput(`Remove exit condition: ${condition.description}`)
                                setShowPositionModal(false)
                                setSelectedPosition(null)
                                setTimeout(() => inputRef.current?.focus(), 100)
                              }}
                              className="opacity-0 group-hover:opacity-100 text-bloomberg-red text-[9px] px-2 py-1 hover:bg-bloomberg-red/10 transition-opacity"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Main Input Area */}
          <div className="flex-1 flex flex-col justify-center items-center p-4 md:p-8 min-h-0 overflow-y-auto" style={{ marginTop: '-10vh' }}>
            <div className="w-full max-w-5xl px-4 md:px-0">
              {/* Tagline - Above CATALYST */}
              <div className="mb-3 md:mb-3 flex items-center gap-2">
                <div className="flex flex-wrap items-center gap-2 text-sm md:text-base font-mono">
                  <span className="text-bloomberg-text font-bold">React faster to the world's</span>
                  <span className="text-[#8B5CF6] font-bold">changing probabilities.</span>
                </div>
              </div>
              
              {/* Prompt Line - Optimized */}
              <div className="mb-3 flex items-center gap-2">
                <span className="text-[#8B5CF6] font-mono text-xs md:text-sm font-bold">CATALYST&gt;</span>
              </div>

              {/* Input Field */}
              <div className="bg-bloomberg-panel border border-terminal p-2 md:p-2 overflow-hidden">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[#8B5CF6] text-xs md:text-sm flex-shrink-0">&gt;</span>
                  <input
                    key={`input-${isBetweenExamples ? 'empty' : 'active'}-${displayedText.length}`}
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    readOnly
                    placeholder=""
                    className="flex-1 bg-transparent text-bloomberg-text outline-none font-mono text-xs md:text-sm cursor-default min-w-0 overflow-x-auto"
                    tabIndex={-1}
                  />
                  {showCursor && (
                    <span className="w-[2px] h-4 bg-[#8B5CF6] blink flex-shrink-0" />
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setShowEarlyAccessModal(true)
                  }}
                  className="px-4 py-3 md:py-2 bg-[#8B5CF6] border border-[#8B5CF6] text-white hover:bg-[#7C3AED] hover:border-[#7C3AED] text-xs font-mono uppercase transition-colors cursor-pointer font-bold text-center"
                >
                  GET EARLY ACCESS
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    window.open('https://twitter.com/use_catalyst', '_blank', 'noopener,noreferrer')
                  }}
                  className="px-4 py-3 md:py-2 bg-bloomberg-panel border border-terminal text-bloomberg-text hover:bg-bloomberg-bg hover:border-[#8B5CF6] text-xs font-mono uppercase transition-colors cursor-pointer text-center"
                >
                  FOLLOW ON X
                </button>
              </div>
            </div>
          </div>

          {/* Early Access Modal */}
          {showEarlyAccessModal && (
            <div 
              className="absolute inset-0 bg-bloomberg-bg/95 z-50 flex items-center justify-center p-4 md:p-8"
              onClick={() => {
                setShowEarlyAccessModal(false)
                setEarlyAccessEmail('')
                setEarlyAccessTelegram('')
                setEarlyAccessSubmitted(false)
              }}
            >
              <div 
                className="bg-bloomberg-panel border-2 border-[#8B5CF6] max-w-lg w-full p-4 md:p-6 max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="text-[#8B5CF6] text-base md:text-lg font-bold uppercase font-mono">EARLY ACCESS</div>
                  <button
                    onClick={() => {
                      setShowEarlyAccessModal(false)
                      setEarlyAccessEmail('')
                      setEarlyAccessTelegram('')
                      setEarlyAccessSubmitted(false)
                    }}
                    className="text-bloomberg-text-dim hover:text-bloomberg-text text-2xl md:text-xl font-bold leading-none"
                  >
                    ×
                  </button>
                </div>
                
                {!earlyAccessSubmitted ? (
                  <>
                    <div className="mb-4 md:mb-6 space-y-3 md:space-y-4">
                      <div className="text-bloomberg-text text-xs md:text-sm font-mono">
                        Join the waitlist to be among the first to trade with event-aware conditional orders.
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="block text-bloomberg-text-dim text-xs font-mono uppercase mb-1">
                            EMAIL
                          </label>
                          <input
                            type="email"
                            value={earlyAccessEmail}
                            onChange={(e) => setEarlyAccessEmail(e.target.value)}
                            placeholder="trader@example.com"
                            className="w-full bg-bloomberg-bg border border-terminal px-3 py-2.5 md:py-2 text-bloomberg-text text-sm font-mono outline-none focus:border-[#8B5CF6] placeholder:text-bloomberg-text-dim"
                            autoFocus
                          />
                        </div>
                        
                        <div>
                          <label className="block text-bloomberg-text-dim text-xs font-mono uppercase mb-1">
                            TELEGRAM USERNAME (OPTIONAL)
                          </label>
                          <input
                            type="text"
                            value={earlyAccessTelegram}
                            onChange={(e) => setEarlyAccessTelegram(e.target.value)}
                            placeholder="@username"
                            className="w-full bg-bloomberg-bg border border-terminal px-3 py-2.5 md:py-2 text-bloomberg-text text-sm font-mono outline-none focus:border-[#8B5CF6] placeholder:text-bloomberg-text-dim"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          if (earlyAccessEmail.trim()) {
                            // Here you would typically send to your backend
                            console.log('Early access signup:', { email: earlyAccessEmail, telegram: earlyAccessTelegram })
                            setEarlyAccessSubmitted(true)
                          }
                        }}
                        disabled={!earlyAccessEmail.trim()}
                        className="flex-1 px-4 py-3 md:py-2.5 bg-[#8B5CF6] border border-[#8B5CF6] text-white hover:bg-[#7C3AED] hover:border-[#7C3AED] text-xs font-mono uppercase transition-colors cursor-pointer font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        SUBMIT
                      </button>
                      <button
                        onClick={() => {
                          setShowEarlyAccessModal(false)
                          setEarlyAccessEmail('')
                          setEarlyAccessTelegram('')
                        }}
                        className="px-4 py-2.5 bg-bloomberg-bg border border-terminal text-bloomberg-text hover:border-bloomberg-text-dim text-xs font-mono uppercase transition-colors cursor-pointer"
                      >
                        CANCEL
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-bloomberg-green text-4xl mb-4">✓</div>
                    <div className="text-bloomberg-text text-lg font-bold font-mono mb-2">
                      YOU'RE ON THE LIST
                    </div>
                    <div className="text-bloomberg-text-dim text-sm font-mono mb-6">
                      We'll notify you when Catalyst is ready.
                    </div>
                    <button
                      onClick={() => {
                        setShowEarlyAccessModal(false)
                        setEarlyAccessEmail('')
                        setEarlyAccessTelegram('')
                        setEarlyAccessSubmitted(false)
                      }}
                      className="px-4 py-2 bg-[#8B5CF6] border border-[#8B5CF6] text-white hover:bg-[#7C3AED] text-xs font-mono uppercase transition-colors cursor-pointer font-bold"
                    >
                      CLOSE
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Help Modal */}
          {showHelp && (
            <div 
              className="absolute inset-0 bg-bloomberg-bg/95 z-20 flex items-center justify-center p-8"
              onClick={() => setShowHelp(false)}
            >
              <div 
                className="bg-bloomberg-panel border-2 border-terminal max-w-2xl w-full p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="text-bloomberg-orange text-sm font-bold uppercase">Help</div>
                  <button
                    onClick={() => setShowHelp(false)}
                    className="text-bloomberg-text-dim hover:text-bloomberg-text"
                  >
                    [ESC] Close
                  </button>
                </div>
                <div className="space-y-3 text-xs font-mono text-bloomberg-text">
                  <div>
                    <div className="text-bloomberg-orange mb-1 font-bold">STRATEGY SYNTAX</div>
                    <div className="text-bloomberg-text-dim pl-2 text-[10px]">
                      Use natural language to describe your trading strategy. The compiler will extract:
                    </div>
                    <ul className="pl-4 mt-1 space-y-1 text-[10px] text-bloomberg-text-dim">
                      <li>• Asset: BTC, ETH, SOL, AVAX, etc.</li>
                      <li>• Action: Long or Short</li>
                      <li>• Event: Polymarket event (required)</li>
                      <li>• Additional: OI changes, Price levels (optional)</li>
                      <li>• Risk: Stop loss, Take profit, Leverage</li>
                    </ul>
                  </div>
                  <div>
                    <div className="text-bloomberg-orange mb-1 font-bold">KEYBOARD SHORTCUTS</div>
                    <div className="pl-2 text-[10px] text-bloomberg-text-dim space-y-0.5">
                      <div>ENTER - Compile strategy</div>
                      <div>F1 - Toggle help</div>
                      <div>F2 - Show examples</div>
                      <div>F3 - View history</div>
                      <div>↑ - Previous command</div>
                    </div>
                  </div>
                  <div>
                    <div className="text-bloomberg-orange mb-1 font-bold">SUPPORTED CONDITIONS</div>
                    <div className="pl-2 text-[10px] text-bloomberg-text-dim">
                      Polymarket events (required), Open Interest (OI) changes, Price levels (optional)
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Full-Screen Markets Modal */}
          {showMarketsModal && (
            <div 
              className="absolute inset-0 bg-bloomberg-bg z-30 flex flex-col"
              onClick={(e) => {
                // Only close if clicking the backdrop, not the modal content
                if (e.target === e.currentTarget) {
                  setShowMarketsModal(false)
                  setMarketSearchQuery('')
                  setSelectedCategory(null)
                }
              }}
            >
              {/* Modal Header */}
              <div className="bg-bloomberg-panel border-b-2 border-terminal px-6 py-3 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="text-[#8B5CF6] text-lg font-bold uppercase">Polymarket Live Markets</div>
                  {!loadingMarkets && marketsLastUpdated && (
                    <div className="flex items-center gap-2 text-bloomberg-green text-xs font-mono">
                      <span>●</span>
                      <span>Connected</span>
                      <span className="text-bloomberg-text-dim">•</span>
                      <span className="text-bloomberg-text-dim">Updated {marketsLastUpdated.toLocaleTimeString()}</span>
                    </div>
                  )}
                  {(marketSearchQuery.trim() || selectedCategory) && (
                    <>
                      <span className="text-bloomberg-text-dim">•</span>
                      <span className="text-bloomberg-text text-xs">
                        {polymarketMarkets.length} {polymarketMarkets.length === 1 ? 'market' : 'markets'}
                      </span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-bloomberg-text-dim text-xs font-mono">
                    Press <kbd className="px-1.5 py-0.5 bg-bloomberg-bg border border-terminal">ESC</kbd> or <kbd className="px-1.5 py-0.5 bg-bloomberg-bg border border-terminal">F5</kbd> to close
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowMarketsModal(false)
                      setMarketSearchQuery('')
                      setSelectedCategory(null)
                    }}
                    className="text-bloomberg-text-dim hover:text-bloomberg-text text-sm font-mono px-3 py-1 border border-terminal hover:border-[#8B5CF6] transition-colors"
                  >
                    [ESC] Close
                  </button>
                </div>
              </div>

              {/* Search and Filter Bar */}
              <div className="bg-bloomberg-bg border-b border-terminal px-6 py-3 flex-shrink-0">
                <div className="flex gap-4 items-center">
                  {/* Search Input */}
                  <div className="flex-1 max-w-md">
                    <input
                      type="text"
                      value={marketSearchQuery}
                      onChange={(e) => {
                        setMarketSearchQuery(e.target.value)
                        setSelectedCategory(null) // Clear category when searching
                      }}
                      placeholder="Search all Polymarket markets..."
                      autoFocus
                      className="w-full bg-bloomberg-panel border-2 border-terminal px-4 py-2.5 text-sm text-bloomberg-text outline-none focus:border-[#8B5CF6] placeholder:text-bloomberg-text-dim font-mono"
                    />
                  </div>
                  
                  {/* Category Filter */}
                  <div className="flex items-center gap-2">
                    <span className="text-bloomberg-text-dim text-xs font-mono uppercase">Category:</span>
                    <select
                      value={selectedCategory || ''}
                      onChange={(e) => {
                        setSelectedCategory(e.target.value || null)
                        setMarketSearchQuery('') // Clear search when filtering by category
                      }}
                      className="bg-bloomberg-panel border-2 border-terminal px-3 py-2.5 text-sm text-bloomberg-text outline-none focus:border-[#8B5CF6] font-mono"
                    >
                      <option value="">All Categories</option>
                      {availableCategories.map(cat => (
                        <option key={cat} value={cat}>{cat.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Clear Filters Button */}
                  {(marketSearchQuery.trim() || selectedCategory) && (
                    <button
                      type="button"
                      onClick={() => {
                        setMarketSearchQuery('')
                        setSelectedCategory(null)
                      }}
                      className="text-bloomberg-text-dim hover:text-bloomberg-text text-xs font-mono px-3 py-2 border border-terminal hover:border-bloomberg-red transition-colors"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              </div>

              {/* Markets Grid with Pagination */}
              <div className="flex-1 flex flex-col overflow-hidden">
                {loadingMarkets ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-bloomberg-text-dim text-sm flex items-center gap-2">
                      <span className="animate-pulse">●</span>
                      <span>Loading live markets...</span>
                    </div>
                  </div>
                ) : polymarketMarkets.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-bloomberg-text-dim text-sm">
                      {marketSearchQuery.trim() 
                        ? `No markets match "${marketSearchQuery}"`
                        : selectedCategory
                        ? `No markets in category "${selectedCategory}"`
                        : 'No markets available'}
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Markets Grid */}
                    <div className="flex-1 overflow-y-auto p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {polymarketMarkets.map((market) => {
                      const prob = market.currentProbability || 70
                      const liquidityK = market.liquidity >= 1000000 
                        ? (market.liquidity / 1000000).toFixed(1) + 'M'
                        : (market.liquidity / 1000).toFixed(0) + 'K'
                      
                      // Auto-suggest asset based on event name
                      const suggestAsset = (question: string): string => {
                        const q = question.toLowerCase()
                        if (q.includes('bitcoin') || q.includes('btc')) return 'BTC'
                        if (q.includes('ethereum') || q.includes('eth')) return 'ETH'
                        if (q.includes('solana') || q.includes('sol')) return 'SOL'
                        if (q.includes('avalanche') || q.includes('avax')) return 'AVAX'
                        if (q.includes('arbitrum') || q.includes('arb')) return 'ARB'
                        if (q.includes('optimism') || q.includes('op')) return 'OP'
                        return 'ETH' // Default
                      }
                      
                      return (
                        <div
                          key={market.id}
                          className="bg-bloomberg-panel border-2 border-terminal p-4 group"
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="text-[#8B5CF6] text-sm font-bold flex-1 group-hover:text-[#8B5CF6] line-clamp-2">
                              {market.question}
                            </div>
                            <div className="text-bloomberg-green text-xs font-bold whitespace-nowrap">
                              {prob.toFixed(0)}%
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-xs text-bloomberg-text-dim mb-2">
                            <span>${liquidityK} liquidity</span>
                            <span className="text-bloomberg-green">● Live</span>
                          </div>
                          {market.category && (
                            <div className="text-[9px] text-bloomberg-text-dim uppercase mb-2">
                              {market.category}
                            </div>
                          )}
                          <div className="mt-2 pt-2 border-t border-terminal/30 flex items-center justify-between">
                            <div className="text-[9px] text-bloomberg-text-dim">
                              Click to build strategy
                            </div>
                            {market.rules && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedMarket(market)
                                  setShowMarketRules(true)
                                }}
                                className="text-[8px] text-bloomberg-text-dim hover:text-[#8B5CF6] font-mono transition-colors px-1.5 py-0.5 border border-terminal hover:border-[#8B5CF6]"
                                title="View market rules"
                              >
                                Rules
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                      </div>
                    </div>
                    
                    {/* Footer with Market Count */}
                    <div className="bg-bloomberg-panel border-t border-terminal px-6 py-2 flex items-center justify-between flex-shrink-0">
                      <div className="text-bloomberg-text-dim text-xs font-mono">
                        Showing {polymarketMarkets.length} {polymarketMarkets.length === 1 ? 'market' : 'markets'}
                        {selectedCategory && ` in ${selectedCategory.toUpperCase()}`}
                        {marketSearchQuery.trim() && ` matching "${marketSearchQuery}"`}
                      </div>
                      <div className="text-bloomberg-text-dim text-[10px] font-mono">
                        Scroll to view all markets
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Strategy Builder Modal */}
          {showStrategyBuilder && selectedMarket && (
            <div 
              className="absolute inset-0 bg-bloomberg-bg/95 z-20 flex items-center justify-center p-8"
              onClick={() => setShowStrategyBuilder(false)}
            >
              <div 
                className="bg-bloomberg-panel border-2 border-terminal max-w-lg w-full p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="text-[#8B5CF6] text-sm font-bold uppercase">Quick Strategy Builder</div>
                  <button
                    onClick={() => setShowStrategyBuilder(false)}
                    className="text-bloomberg-text-dim hover:text-bloomberg-text"
                  >
                    [ESC] Close
                  </button>
                </div>
                
                <div className="space-y-4 text-xs font-mono">
                  {/* Mode Toggle */}
                  <div>
                    <div className="text-bloomberg-text-dim text-[10px] mb-1 uppercase">Mode</div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setBuilderMode('new')
                          setSelectedPosition(null)
                        }}
                        className={`flex-1 py-2 border text-[10px] font-bold transition-colors ${
                          builderMode === 'new'
                            ? 'bg-[#8B5CF6]/20 border-[#8B5CF6] text-[#8B5CF6]'
                            : 'bg-bloomberg-bg border-terminal text-bloomberg-text-dim hover:text-bloomberg-text'
                        }`}
                      >
                        NEW POSITION
                      </button>
                      <button
                        type="button"
                        onClick={() => setBuilderMode('adjust')}
                        className={`flex-1 py-2 border text-[10px] font-bold transition-colors ${
                          builderMode === 'adjust'
                            ? 'bg-bloomberg-orange/20 border-bloomberg-orange text-bloomberg-orange'
                            : 'bg-bloomberg-bg border-terminal text-bloomberg-text-dim hover:text-bloomberg-text'
                        }`}
                      >
                        ADJUST EXISTING
                      </button>
                    </div>
                  </div>

                  {/* Event Display - Enhanced with Market Details */}
                  <div>
                    <div className="text-bloomberg-text-dim text-[10px] mb-1 uppercase">Polymarket Event</div>
                    <div className="bg-bloomberg-bg border border-terminal p-3 space-y-2">
                      <div className="text-[#8B5CF6] text-[10px] font-bold leading-relaxed">
                        {selectedMarket.question}
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-terminal/30">
                        <div>
                          <div className="text-bloomberg-text-dim text-[8px] mb-0.5">CURRENT PROB</div>
                          <div className="text-bloomberg-green text-[11px] font-bold">
                            {(selectedMarket.currentProbability || 70).toFixed(1)}%
                          </div>
                        </div>
                        <div>
                          <div className="text-bloomberg-text-dim text-[8px] mb-0.5">TARGET</div>
                          <div className="text-bloomberg-text text-[11px] font-bold">
                            {builderProbability}%
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <div>
                          <div className="text-bloomberg-text-dim text-[8px] mb-0.5">LIQUIDITY</div>
                          <div className="text-bloomberg-text text-[9px] font-bold">
                            {selectedMarket.liquidity >= 1000000 
                              ? `$${(selectedMarket.liquidity / 1000000).toFixed(1)}M`
                              : `$${(selectedMarket.liquidity / 1000).toFixed(0)}K`}
                          </div>
                        </div>
                        <div>
                          <div className="text-bloomberg-text-dim text-[8px] mb-0.5">VOLUME (24H)</div>
                          <div className="text-bloomberg-text text-[9px] font-bold">
                            {selectedMarket.volume >= 1000000 
                              ? `$${(selectedMarket.volume / 1000000).toFixed(1)}M`
                              : `$${(selectedMarket.volume / 1000).toFixed(0)}K`}
                          </div>
                        </div>
                      </div>
                      {selectedMarket.endDate && (
                        <div className="pt-1 border-t border-terminal/30">
                          <div className="text-bloomberg-text-dim text-[8px] mb-0.5">RESOLUTION DATE</div>
                          <div className="text-bloomberg-text text-[9px] font-bold">
                            {new Date(selectedMarket.endDate).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric', 
                              year: 'numeric' 
                            })}
                          </div>
                        </div>
                      )}
                      {selectedMarket.category && (
                        <div className="pt-1">
                          <div className="text-bloomberg-text-dim text-[8px] mb-0.5">CATEGORY</div>
                          <div className="text-bloomberg-text text-[9px] font-bold uppercase">
                            {selectedMarket.category}
                          </div>
                        </div>
                      )}
                      
                      {/* View Rules Button */}
                      <div className="pt-2 border-t border-terminal/30">
                        <button
                          type="button"
                          onClick={() => setShowMarketRules(true)}
                          className="w-full text-left text-bloomberg-text-dim hover:text-[#8B5CF6] text-[9px] font-mono transition-colors flex items-center gap-1"
                        >
                          <span>▶</span>
                          <span>View Market Rules</span>
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Market Rules Modal */}
                  {showMarketRules && selectedMarket && (
                    <div 
                      className="absolute inset-0 bg-bloomberg-bg/98 z-40 flex items-center justify-center p-8"
                      onClick={() => setShowMarketRules(false)}
                    >
                      <div 
                        className="bg-bloomberg-panel border-2 border-terminal max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="text-[#8B5CF6] text-sm font-bold uppercase">Market Rules & Resolution Criteria</div>
                          <button
                            onClick={() => setShowMarketRules(false)}
                            className="text-bloomberg-text-dim hover:text-bloomberg-text text-sm font-mono"
                          >
                            [ESC] Close
                          </button>
                        </div>
                        
                        <div className="space-y-4 text-xs font-mono">
                          {/* Market Question */}
                          <div>
                            <div className="text-bloomberg-text-dim text-[10px] mb-1 uppercase">Market Question</div>
                            <div className="text-[#8B5CF6] text-sm font-bold leading-relaxed">
                              {selectedMarket.question}
                            </div>
                          </div>
                          
                          {/* Resolution Source */}
                          <div>
                            <div className="text-bloomberg-text-dim text-[10px] mb-1 uppercase">Resolution Source</div>
                            <div className="text-bloomberg-text text-[11px]">
                              {selectedMarket.resolutionSource || 'Market'}
                            </div>
                          </div>
                          
                          {/* Resolution Date */}
                          {selectedMarket.endDate && (
                            <div>
                              <div className="text-bloomberg-text-dim text-[10px] mb-1 uppercase">Resolution Deadline</div>
                              <div className="text-bloomberg-text text-[11px]">
                                {new Date(selectedMarket.endDate).toLocaleString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric', 
                                  year: 'numeric',
                                  hour: 'numeric',
                                  minute: '2-digit',
                                  timeZoneName: 'short'
                                })}
                              </div>
                            </div>
                          )}
                          
                          {/* Market Rules */}
                          <div>
                            <div className="text-bloomberg-text-dim text-[10px] mb-2 uppercase">Resolution Rules</div>
                            <div className="bg-bloomberg-bg border border-terminal p-4 text-bloomberg-text text-[11px] leading-relaxed whitespace-pre-wrap">
                              {selectedMarket.rules || selectedMarket.description || 'No specific rules provided. This market will resolve based on standard Polymarket resolution criteria for the stated question.'}
                            </div>
                          </div>
                          
                          {/* Additional Info */}
                          {selectedMarket.description && selectedMarket.rules && (
                            <div>
                              <div className="text-bloomberg-text-dim text-[10px] mb-2 uppercase">Additional Information</div>
                              <div className="bg-bloomberg-bg border border-terminal p-3 text-bloomberg-text-dim text-[10px] leading-relaxed">
                                {selectedMarket.description}
                              </div>
                            </div>
                          )}
                          
                          {/* Market Metadata */}
                          <div className="pt-2 border-t border-terminal/30">
                            <div className="grid grid-cols-2 gap-4 text-[10px]">
                              <div>
                                <div className="text-bloomberg-text-dim mb-1">Market ID</div>
                                <div className="text-bloomberg-text font-mono">{selectedMarket.id}</div>
                              </div>
                              {selectedMarket.conditionId && (
                                <div>
                                  <div className="text-bloomberg-text-dim mb-1">Condition ID</div>
                                  <div className="text-bloomberg-text font-mono text-[9px]">{selectedMarket.conditionId}</div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Existing Positions List (when in adjust mode) */}
                  {builderMode === 'adjust' && (
                    <div>
                      <div className="text-bloomberg-text-dim text-[10px] mb-1 uppercase">Select Position</div>
                      <div className="space-y-1.5 max-h-48 overflow-y-auto">
                        {mockPositions.map((pos) => {
                          const pnlColor = pos.unrealizedPnl >= 0 ? 'text-bloomberg-green' : 'text-bloomberg-red'
                          const pnlSign = pos.unrealizedPnl >= 0 ? '+' : ''
                          return (
                            <div
                              key={pos.id}
                              onClick={() => setSelectedPositionId(pos.id)}
                              className={`cursor-pointer border p-2 transition-colors ${
                                selectedPositionId === pos.id
                                  ? 'bg-bloomberg-orange/10 border-bloomberg-orange'
                                  : 'bg-bloomberg-bg border-terminal hover:border-bloomberg-orange/50'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-bold text-bloomberg-text">{pos.id}</span>
                                  <span className={`text-[10px] font-bold ${pos.direction === 'Long' ? 'text-bloomberg-green' : 'text-bloomberg-red'}`}>
                                    {pos.direction} {pos.asset}
                                  </span>
                                </div>
                                <span className={`text-[10px] font-bold ${pnlColor}`}>
                                  {pnlSign}${pos.unrealizedPnl.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-[9px] text-bloomberg-text-dim">
                                <span>Entry: ${pos.entryPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                                <span>Current: ${pos.currentPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                                <span>Size: ${pos.size.toLocaleString()}</span>
                                <span>{pos.leverage}x</span>
                                <span className={pnlColor}>{pnlSign}{pos.unrealizedPnlPercent.toFixed(2)}%</span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Position Action (when in adjust mode and position selected) */}
                  {builderMode === 'adjust' && selectedPositionId && (
                    <>
                      <div>
                        <div className="text-bloomberg-text-dim text-[10px] mb-1 uppercase">Action</div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setBuilderPositionAction('CLOSE')}
                            className={`flex-1 py-2 border text-[10px] font-bold transition-colors ${
                              builderPositionAction === 'CLOSE'
                                ? 'bg-bloomberg-green/20 border-bloomberg-green text-bloomberg-green'
                                : 'bg-bloomberg-bg border-terminal text-bloomberg-text-dim hover:text-bloomberg-text'
                            }`}
                          >
                            CLOSE
                          </button>
                          <button
                            type="button"
                            onClick={() => setBuilderPositionAction('REVERSE')}
                            className={`flex-1 py-2 border text-[10px] font-bold transition-colors ${
                              builderPositionAction === 'REVERSE'
                                ? 'bg-bloomberg-orange/20 border-bloomberg-orange text-bloomberg-orange'
                                : 'bg-bloomberg-bg border-terminal text-bloomberg-text-dim hover:text-bloomberg-text'
                            }`}
                          >
                            REVERSE
                          </button>
                          <button
                            type="button"
                            onClick={() => setBuilderPositionAction('CANCEL')}
                            className={`flex-1 py-2 border text-[10px] font-bold transition-colors ${
                              builderPositionAction === 'CANCEL'
                                ? 'bg-bloomberg-red/20 border-bloomberg-red text-bloomberg-red'
                                : 'bg-bloomberg-bg border-terminal text-bloomberg-text-dim hover:text-bloomberg-text'
                            }`}
                          >
                            CANCEL
                          </button>
                        </div>
                      </div>

                      {/* Position Size (for partial closes) */}
                      {builderPositionAction === 'CLOSE' && (
                        <div>
                          <div className="text-bloomberg-text-dim text-[10px] mb-1 uppercase">
                            Position Size ({builderPositionSize}%)
                          </div>
                          <input
                            type="number"
                            value={builderPositionSize}
                            onChange={(e) => setBuilderPositionSize(Math.min(100, Math.max(1, parseInt(e.target.value) || 100)))}
                            min="1"
                            max="100"
                            className="w-full bg-bloomberg-bg border border-terminal p-2 text-bloomberg-text text-[10px] outline-none focus:border-[#8B5CF6]"
                          />
                          <div className="text-[9px] text-bloomberg-text-dim mt-1">
                            {builderPositionSize === 100 ? 'Close entire position' : `Close ${builderPositionSize}% of position`}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Asset Selection (only for new positions) */}
                  {builderMode === 'new' && (
                    <div>
                      <div className="text-bloomberg-text-dim text-[10px] mb-1 uppercase">Asset</div>
                      <SearchableAssetSelect
                        value={builderAsset}
                        onChange={setBuilderAsset}
                        markets={hyperliquidMarkets}
                        loading={loadingHyperliquid}
                      />
                    </div>
                  )}

                  {/* Action Toggle (only for new positions) */}
                  {builderMode === 'new' && (
                    <div>
                      <div className="text-bloomberg-text-dim text-[10px] mb-1 uppercase">Action</div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setBuilderAction('Long')}
                          className={`flex-1 py-2 border text-[10px] font-bold transition-colors ${
                            builderAction === 'Long'
                              ? 'bg-bloomberg-green/20 border-bloomberg-green text-bloomberg-green'
                              : 'bg-bloomberg-bg border-terminal text-bloomberg-text-dim hover:text-bloomberg-text'
                          }`}
                        >
                          LONG
                        </button>
                        <button
                          type="button"
                          onClick={() => setBuilderAction('Short')}
                          className={`flex-1 py-2 border text-[10px] font-bold transition-colors ${
                            builderAction === 'Short'
                              ? 'bg-bloomberg-red/20 border-bloomberg-red text-bloomberg-red'
                              : 'bg-bloomberg-bg border-terminal text-bloomberg-text-dim hover:text-bloomberg-text'
                          }`}
                        >
                          SHORT
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Probability Threshold */}
                  <div>
                    <div className="text-bloomberg-text-dim text-[10px] mb-1 uppercase">
                      Probability Threshold (Current: {(selectedMarket.currentProbability || 70).toFixed(0)}%)
                    </div>
                    <input
                      type="number"
                      value={builderProbability}
                      onChange={(e) => setBuilderProbability(parseInt(e.target.value) || 70)}
                      min="0"
                      max="100"
                      className="w-full bg-bloomberg-bg border border-terminal p-2 text-bloomberg-text text-[10px] outline-none focus:border-[#8B5CF6]"
                    />
                  </div>

                  {/* Quick Add Conditions */}
                  <div>
                    <div className="text-bloomberg-text-dim text-[10px] mb-2 uppercase">Additional Conditions</div>
                    
                    {/* Price Condition */}
                    <div className="mb-2 flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={builderPriceCondition.enabled}
                        onChange={(e) => setBuilderPriceCondition(prev => ({ ...prev, enabled: e.target.checked }))}
                        className="w-3 h-3"
                      />
                      <span className="text-[10px] text-bloomberg-text-dim">Price</span>
                      {builderPriceCondition.enabled && (
                        <>
                          <select
                            value={builderPriceCondition.type}
                            onChange={(e) => setBuilderPriceCondition(prev => ({ ...prev, type: e.target.value as 'above' | 'below' }))}
                            className="bg-bloomberg-bg border border-terminal p-1 text-[9px] text-bloomberg-text outline-none"
                          >
                            <option value="above">above</option>
                            <option value="below">below</option>
                          </select>
                          <input
                            type="text"
                            value={builderPriceCondition.value}
                            onChange={(e) => setBuilderPriceCondition(prev => ({ ...prev, value: e.target.value }))}
                            placeholder="$3200"
                            className="flex-1 bg-bloomberg-bg border border-terminal p-1 text-[9px] text-bloomberg-text outline-none focus:border-[#8B5CF6]"
                          />
                        </>
                      )}
                    </div>

                    {/* OI Condition */}
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={builderOICondition.enabled}
                        onChange={(e) => setBuilderOICondition(prev => ({ ...prev, enabled: e.target.checked }))}
                        className="w-3 h-3"
                      />
                      <span className="text-[10px] text-bloomberg-text-dim">Open Interest</span>
                      {builderOICondition.enabled && (
                        <>
                          <select
                            value={builderOICondition.type}
                            onChange={(e) => setBuilderOICondition(prev => ({ ...prev, type: e.target.value as 'above' | 'rises' }))}
                            className="bg-bloomberg-bg border border-terminal p-1 text-[9px] text-bloomberg-text outline-none"
                          >
                            <option value="above">above</option>
                            <option value="rises">rises</option>
                          </select>
                          <input
                            type="text"
                            value={builderOICondition.value}
                            onChange={(e) => setBuilderOICondition(prev => ({ ...prev, value: e.target.value }))}
                            placeholder={builderOICondition.type === 'above' ? '$2.2B' : '3% over 24h'}
                            className="flex-1 bg-bloomberg-bg border border-terminal p-1 text-[9px] text-bloomberg-text outline-none focus:border-[#8B5CF6]"
                          />
                        </>
                      )}
                    </div>
                  </div>

                  {/* Create Strategy Button */}
                  <button
                    type="button"
                    onClick={() => {
                      let strategy = ''
                      
                      if (builderMode === 'adjust' && selectedPositionId) {
                        // Build position management strategy
                        const position = mockPositions.find(p => p.id === selectedPositionId)
                        if (!position) return
                        
                        if (builderPositionAction === 'CLOSE') {
                          if (builderPositionSize === 100) {
                            strategy = `Close position if Polymarket "${selectedMarket.question}" probability ≥ ${builderProbability}%`
                          } else {
                            strategy = `Close ${builderPositionSize}% of position if Polymarket "${selectedMarket.question}" probability ≥ ${builderProbability}%`
                          }
                        } else if (builderPositionAction === 'REVERSE') {
                          strategy = `Reverse position when Polymarket "${selectedMarket.question}" probability ≥ ${builderProbability}%`
                        } else if (builderPositionAction === 'CANCEL') {
                          strategy = `Cancel position if Polymarket "${selectedMarket.question}" probability ≥ ${builderProbability}%`
                        }
                      } else {
                        // Build new position strategy
                        strategy = `${builderAction} ${builderAsset} if Polymarket "${selectedMarket.question}" probability ≥ ${builderProbability}%`
                      }
                      
                      // Add additional conditions if enabled
                      if (builderPriceCondition.enabled && builderPriceCondition.value) {
                        strategy += ` and price ${builderPriceCondition.type} ${builderPriceCondition.value}`
                      }
                      
                      if (builderOICondition.enabled && builderOICondition.value) {
                        if (builderOICondition.type === 'above') {
                          strategy += ` and OI above ${builderOICondition.value}`
                        } else {
                          strategy += ` and OI rises ${builderOICondition.value}`
                        }
                      }
                      
                      setInput(strategy)
                      setShowStrategyBuilder(false)
                      inputRef.current?.focus()
                    }}
                    disabled={builderMode === 'adjust' && !selectedPositionId}
                    className={`w-full py-2.5 font-bold text-[10px] uppercase transition-colors ${
                      builderMode === 'adjust' && !selectedPositionId
                        ? 'bg-bloomberg-text-dim/20 text-bloomberg-text-dim cursor-not-allowed'
                        : 'bg-[#8B5CF6] hover:bg-[#7C3AED] text-bloomberg-bg'
                    }`}
                  >
                    {builderMode === 'adjust' ? 'Create Exit Strategy' : 'Create Strategy'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Examples Modal */}
          {showExamples && (
            <div className="absolute inset-0 bg-bloomberg-bg/95 z-20 flex items-center justify-center p-8">
              <div className="bg-bloomberg-panel border-2 border-terminal max-w-2xl w-full p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-bloomberg-orange text-sm font-bold uppercase">Example Strategies</div>
                  <button
                    onClick={() => setShowExamples(false)}
                    className="text-bloomberg-text-dim hover:text-bloomberg-text"
                  >
                    [ESC] Close
                  </button>
                </div>
                <div className="space-y-2 text-xs font-mono">
                  {[
                    'Long ETH if Polymarket "Ethereum ETF Approval" probability ≥ 65% and price below $3200',
                    'Long BTC when Polymarket "SEC approves spot Bitcoin ETF" probability ≥ 60% and OI rises 3% over 24h',
                    'Long ETH if Polymarket "Fed cuts rates" probability ≥ 70% and price above $3000',
                    'Short BTC if Polymarket "Bitcoin hits $100k by end of year" probability ≥ 75% and price above $95000',
                    'Long SOL when Polymarket "Fed cuts rates by 0.5%" probability ≥ 65% and OI above $1.5B',
                    'Long ETH if Polymarket "Ethereum upgrade completes successfully" probability ≥ 80% and price above $3100',
                    'Long ETH if Polymarket "Ethereum ETF Approval" probability ≥ 70% AND Polymarket "Fed cuts rates" probability ≥ 65%',
                    'Long BTC when Polymarket "Bitcoin ETF approval" probability ≥ 75% OR Polymarket "SEC approves crypto" probability ≥ 70%',
                    'Long ETH if Polymarket "Ethereum ETF Approval" probability ≥ 65% and OI rises 5% over 24h and price below $3200',
                    'Long BTC when Polymarket "Bitcoin ETF approval" probability ≥ 70% and OI above $2B and price above $95000',
                    'Long ETH if Polymarket "Ethereum ETF Approval" probability ≥ 65% and increase position by 50% if probability reaches 80%',
                    'Long BTC when Polymarket "Bitcoin hits $100k" probability ≥ 70% and OI rises 3% over 24h and decrease position by 25% if probability drops to 60%',
                    'Long ETH if Polymarket "Ethereum ETF Approval" probability ≥ 70% AND Polymarket "Fed cuts rates" probability ≥ 65% and OI above $1.5B',
                    'Long BTC if Polymarket "Bitcoin ETF approval" probability ≥ 75% and price above $95000 and increase position by 30% if probability reaches 85%'
                  ].map((example, i) => (
                    <div
                      key={i}
                      onClick={() => {
                        setInput(example)
                        setShowExamples(false)
                      }}
                      className="p-2 bg-bloomberg-bg border border-terminal hover:border-bloomberg-orange cursor-pointer text-bloomberg-text hover:text-bloomberg-orange transition-colors text-[10px]"
                    >
                      {example}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Bottom Status Bar */}
          <div className="bg-bloomberg-panel border-t border-terminal h-6 flex items-center justify-between px-2 text-xs flex-shrink-0 z-30">
            <div className="flex items-center gap-4 text-bloomberg-text-dim">
              <span className={showHelp ? 'text-bloomberg-orange' : ''}>F1: Help</span>
              <span className={showExamples ? 'text-bloomberg-orange' : ''}>F2: Examples</span>
              <span className={showMarketsModal ? 'text-bloomberg-orange' : ''}>F5: Markets</span>
              <span className={history.length > 0 ? 'text-bloomberg-text' : ''}>F3: History {history.length > 0 && `(${history.length})`}</span>
              <span>F4: Random</span>
              <span className="text-bloomberg-text-dim">|</span>
              <span className="text-[9px]">↑: Previous</span>
            </div>
            <div className="text-bloomberg-green">
              READY
            </div>
          </div>
        </div>
      </div>

      {/* Conditional Orders and Positions Section - Bottom */}
      {(() => {
        // Mock pending conditional orders
        const pendingOrders = [
          {
            id: 'ORD-001',
            asset: 'ETH',
            direction: 'Long' as const,
            condition: 'Polymarket "Ethereum ETF Approval" probability ≥ 75%',
            size: 100000,
            leverage: 3,
            status: 'PENDING' as const,
            createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString() // 30 minutes ago
          }
        ]
        
        return (positions.length > 0 || pendingOrders.length > 0) ? (
          <div className="absolute bottom-[24px] left-64 right-0 bg-bloomberg-panel border-t-2 border-bloomberg-green/30 px-4 py-2.5 flex-shrink-0 z-10 shadow-[0_-2px_8px_rgba(0,0,0,0.2)] max-h-[200px] overflow-y-auto">
            {/* Conditional Orders Section */}
            {pendingOrders.length > 0 && (
              <div className="mb-3 pb-3 border-b border-terminal/50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowPendingOrders(!showPendingOrders)}
                      className="text-bloomberg-text-dim hover:text-bloomberg-text text-[8px] transition-colors"
                    >
                      {showPendingOrders ? '▼' : '▶'}
                    </button>
                    <div className="w-1.5 h-1.5 bg-bloomberg-orange rounded-full animate-pulse"></div>
                    <div className="text-bloomberg-text text-[9px] font-bold uppercase">
                      Pending Conditional Orders ({pendingOrders.length})
                    </div>
                  </div>
                  <div className="text-bloomberg-text-dim text-[8px]">
                    Waiting for conditions to trigger
                  </div>
                </div>
                {showPendingOrders && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                  {pendingOrders.map((order) => {
                    const directionColor = order.direction === 'Long' ? 'text-bloomberg-green' : 'text-bloomberg-red'
                    const timeAgo = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / (1000 * 60))
                    const timeDisplay = timeAgo < 60 
                      ? `${timeAgo}m ago`
                      : `${Math.floor(timeAgo / 60)}h ${timeAgo % 60}m ago`
                    
                    return (
                      <div
                        key={order.id}
                        className="bg-bloomberg-bg border border-bloomberg-orange/30 hover:border-bloomberg-orange transition-all cursor-pointer px-3 py-2 min-w-[280px] relative group"
                      >
                        {/* Active indicator bar */}
                        <div className="absolute top-0 left-0 right-0 h-0.5 bg-bloomberg-orange/60 group-hover:bg-bloomberg-orange"></div>
                        
                        {/* Header */}
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-bloomberg-text text-[10px] font-bold">{order.asset}</span>
                            <span className={`${directionColor} text-[9px] font-bold`}>
                              {order.direction.toUpperCase()}
                            </span>
                            <span className="text-bloomberg-text-dim text-[8px]">
                              {order.leverage}x
                            </span>
                          </div>
                          <span className="text-bloomberg-orange text-[8px] font-bold px-1.5 py-0.5 bg-bloomberg-orange/20 border border-bloomberg-orange/30">
                            {order.status}
                          </span>
                        </div>
                        
                        {/* Condition */}
                        <div className="mb-1.5">
                          <div className="text-bloomberg-text-dim text-[7px] mb-0.5">Condition:</div>
                          <div className="text-[#8B5CF6] text-[9px] font-mono leading-tight">
                            {order.condition}
                          </div>
                        </div>
                        
                        {/* Size and Time */}
                        <div className="flex items-center justify-between mt-1.5">
                          <div className="text-bloomberg-text-dim text-[8px]">
                            Size: ${(order.size / 1000).toFixed(0)}K
                          </div>
                          <div className="text-bloomberg-text-dim text-[7px]">
                            {timeDisplay}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  </div>
                )}
              </div>
            )}
            
            {/* Active Positions and Limit Orders Section */}
            {(() => {
              // Mock active limit orders (non-automated)
              const limitOrders = [
                {
                  id: 'LIM-001',
                  asset: 'BTC',
                  direction: 'Long' as const,
                  orderType: 'LIMIT' as const,
                  limitPrice: 65000,
                  currentPrice: 67850.42,
                  size: 50000,
                  leverage: 2,
                  status: 'PENDING' as const,
                  createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 minutes ago
                  hasAutomations: false
                }
              ]
              
              const totalActive = positions.length + limitOrders.length
              
              return totalActive > 0 ? (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowActivePositions(!showActivePositions)}
                        className="text-bloomberg-text-dim hover:text-bloomberg-text text-[8px] transition-colors"
                      >
                        {showActivePositions ? '▼' : '▶'}
                      </button>
                      <div className="w-1.5 h-1.5 bg-bloomberg-green rounded-full animate-pulse"></div>
                      <div className="text-bloomberg-text text-[9px] font-bold uppercase">
                        Active Positions & Limit Orders ({totalActive})
                      </div>
                      {positions.some(p => p.exitConditions && p.exitConditions.length > 0) && (
                        <div className="text-[#8B5CF6] text-[8px] font-bold">
                          • {positions.filter(p => p.exitConditions && p.exitConditions.length > 0).length} with automations
                        </div>
                      )}
                    </div>
                    <div className="text-bloomberg-text-dim text-[8px]">
                      Click to manage & add automations
                    </div>
                  </div>
                  {showActivePositions && (
                    <div className="flex gap-2 overflow-x-auto pb-1">
                    {/* Active Positions */}
                    {positions.map((position) => {
              const pnlColor = position.unrealizedPnl >= 0 ? 'text-bloomberg-green' : 'text-bloomberg-red'
              const pnlSign = position.unrealizedPnl >= 0 ? '+' : ''
              const directionColor = position.direction === 'Long' ? 'text-bloomberg-green' : 'text-bloomberg-red'
              const hasAutomations = position.exitConditions && position.exitConditions.length > 0
              const timeInPosition = Math.floor((Date.now() - new Date(position.entryTime).getTime()) / (1000 * 60)) // minutes
              const timeDisplay = timeInPosition < 60 
                ? `${timeInPosition}m` 
                : `${Math.floor(timeInPosition / 60)}h ${timeInPosition % 60}m`
              
              return (
                <div
                  key={position.id}
                  className="bg-bloomberg-bg border border-terminal px-3 py-2 min-w-[220px] relative group"
                >
                  {/* Active indicator bar */}
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-bloomberg-green/60 group-hover:bg-bloomberg-green"></div>
                  
                  {/* Header with asset and automation indicator */}
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-bloomberg-text text-[10px] font-bold">{position.asset}</span>
                      <span className={`${directionColor} text-[9px] font-bold`}>
                        {position.direction.toUpperCase()}
                      </span>
                      <span className="text-bloomberg-text-dim text-[8px]">
                        {position.leverage}x
                      </span>
                    </div>
                    {hasAutomations && (
                      <div className="flex items-center gap-1">
                        <span className="w-1 h-1 bg-[#8B5CF6] rounded-full"></span>
                        <span className="text-[#8B5CF6] text-[7px] font-bold">
                          {position.exitConditions!.length}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Price row with change indicator */}
                  <div className="flex items-center justify-between text-[9px] mb-1">
                    <div className="text-bloomberg-text-dim">
                      Entry: ${position.entryPrice.toFixed(2)}
                    </div>
                    <div className="flex items-center gap-1">
                      {position.priceChange === 'up' && (
                        <span className="text-bloomberg-green text-[8px]">▲</span>
                      )}
                      {position.priceChange === 'down' && (
                        <span className="text-bloomberg-red text-[8px]">▼</span>
                      )}
                      <span className={`text-bloomberg-text font-bold ${position.priceChange ? 'animate-pulse' : ''}`}>
                        ${position.currentPrice.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  
                  {/* P&L row */}
                  <div className="flex items-center justify-between mt-1.5">
                    <div className={`${pnlColor} text-[10px] font-bold`}>
                      {pnlSign}${position.unrealizedPnl.toFixed(2)}
                    </div>
                    <div className={`${pnlColor} text-[9px] font-bold`}>
                      {pnlSign}{position.unrealizedPnlPercent.toFixed(2)}%
                    </div>
                    <div className="text-bloomberg-text-dim text-[7px]">
                      {timeDisplay}
                        </div>
                      </div>
                    </div>
                  )
                })}
                    
                    {/* Active Limit Orders */}
                    {limitOrders.map((order) => {
                      const directionColor = order.direction === 'Long' ? 'text-bloomberg-green' : 'text-bloomberg-red'
                      const timeAgo = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / (1000 * 60))
                      const timeDisplay = timeAgo < 60 
                        ? `${timeAgo}m ago`
                        : `${Math.floor(timeAgo / 60)}h ${timeAgo % 60}m ago`
                      const priceDiff = order.direction === 'Long' 
                        ? ((order.currentPrice - order.limitPrice) / order.limitPrice * 100)
                        : ((order.limitPrice - order.currentPrice) / order.limitPrice * 100)
                      const isNearFill = Math.abs(priceDiff) < 2 // Within 2% of limit price
                      
                      return (
                        <button
                          key={order.id}
                          onClick={() => {
                            // Create a position-like object for the modal
                            const limitOrderAsPosition = {
                              id: order.id,
                              asset: order.asset,
                              direction: order.direction,
                              entryPrice: order.limitPrice,
                              currentPrice: order.currentPrice,
                              size: order.size,
                              leverage: order.leverage,
                              unrealizedPnl: 0,
                              unrealizedPnlPercent: 0,
                              entryTime: order.createdAt,
                              isLimitOrder: true,
                              limitPrice: order.limitPrice,
                              orderType: order.orderType
                            }
                            setSelectedPosition(limitOrderAsPosition as any)
                            setShowConditionBuilder(true)
                            setShowPositionModal(true)
                          }}
                          className="bg-bloomberg-bg border border-bloomberg-blue/30 hover:border-bloomberg-blue transition-all cursor-pointer px-3 py-2 min-w-[240px] relative group"
                        >
                          {/* Limit order indicator bar */}
                          <div className={`absolute top-0 left-0 right-0 h-0.5 ${isNearFill ? 'bg-bloomberg-orange' : 'bg-bloomberg-blue/60'} group-hover:bg-bloomberg-blue`}></div>
                          
                          {/* Header */}
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <span className="text-bloomberg-text text-[10px] font-bold">{order.asset}</span>
                              <span className={`${directionColor} text-[9px] font-bold`}>
                                {order.direction.toUpperCase()}
                              </span>
                              <span className="text-bloomberg-text-dim text-[8px]">
                                {order.leverage}x
                              </span>
                              <span className="text-bloomberg-blue text-[7px] font-bold px-1 bg-bloomberg-blue/20 border border-bloomberg-blue/30">
                                LIMIT
                              </span>
                            </div>
                            <span className={`text-[8px] font-bold px-1.5 py-0.5 ${
                              isNearFill 
                                ? 'bg-bloomberg-orange/20 text-bloomberg-orange border border-bloomberg-orange/30'
                                : 'bg-bloomberg-blue/20 text-bloomberg-blue border border-bloomberg-blue/30'
                            }`}>
                              {order.status}
                            </span>
                          </div>
                          
                          {/* Limit Price vs Current Price */}
                          <div className="flex items-center justify-between text-[9px] mb-1">
                            <div className="text-bloomberg-text-dim">
                              Limit: ${order.limitPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-bloomberg-text-dim text-[8px]">Current:</span>
                              <span className={`text-bloomberg-text font-bold ${isNearFill ? 'text-bloomberg-orange animate-pulse' : ''}`}>
                                ${order.currentPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                              </span>
                            </div>
                          </div>
                          
                          {/* Price difference indicator */}
                          <div className="mb-1.5">
                            <div className="flex items-center justify-between">
                              <div className="text-bloomberg-text-dim text-[8px]">
                                {order.direction === 'Long' 
                                  ? priceDiff > 0 
                                    ? `Above limit by ${priceDiff.toFixed(2)}%`
                                    : `Below limit by ${Math.abs(priceDiff).toFixed(2)}%`
                                  : priceDiff > 0
                                    ? `Below limit by ${priceDiff.toFixed(2)}%`
                                    : `Above limit by ${Math.abs(priceDiff).toFixed(2)}%`
                                }
                              </div>
                              {isNearFill && (
                                <span className="text-bloomberg-orange text-[7px] font-bold animate-pulse">
                                  NEAR FILL
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {/* Size and Time */}
                          <div className="flex items-center justify-between mt-1.5">
                            <div className="text-bloomberg-text-dim text-[8px]">
                              Size: ${(order.size / 1000).toFixed(0)}K
                            </div>
                            <div className="text-bloomberg-text-dim text-[7px]">
                              {timeDisplay}
                            </div>
                          </div>
                          
                          {/* Automation indicator */}
                          {order.hasAutomations && (
                            <div className="flex items-center gap-1 mt-1 pt-1 border-t border-terminal/30">
                              <span className="w-1 h-1 bg-[#8B5CF6] rounded-full"></span>
                              <span className="text-[#8B5CF6] text-[7px] font-bold">
                                Has automations
                              </span>
                            </div>
                          )}
                        </button>
                      )
                    })}
                    </div>
                  )}
                </div>
              ) : null
            })()}
          </div>
        ) : null
      })()}
    </div>
  )
}
