'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Terminal from '@/components/Terminal'
import ParsingAnimation from '@/components/ParsingAnimation'
import StrategySpec from '@/components/StrategySpec'
import SentientReveal from '@/components/CatalystReveal'
import Particles from '@/components/Particles'
import { parseStrategy } from '@/lib/strategyParser'

type FlowState = 
  | 'start'
  | 'typing'
  | 'parsing'
  | 'graph'
  | 'spec'
  | 'simulation'
  | 'reveal'

const FLOW_ORDER: FlowState[] = ['start', 'spec', 'reveal']

export default function Home() {
  const [flowState, setFlowState] = useState<FlowState>('start')
  const [userInput, setUserInput] = useState('')
  const [parsedStrategy, setParsedStrategy] = useState<any>(null)
  const [autoAdvance, setAutoAdvance] = useState(true)
  const autoAdvanceTimers = useRef<NodeJS.Timeout[]>([])

  const advanceFlow = useCallback(() => {
    const currentIndex = FLOW_ORDER.indexOf(flowState)
    if (currentIndex < FLOW_ORDER.length - 1) {
      setFlowState(FLOW_ORDER[currentIndex + 1])
    }
  }, [flowState])

  const goBackFlow = useCallback(() => {
    const currentIndex = FLOW_ORDER.indexOf(flowState)
    if (currentIndex > 0) {
      setFlowState(FLOW_ORDER[currentIndex - 1])
      // Turn off auto-advance when going back (user is manually navigating)
      setAutoAdvance(false)
    }
  }, [flowState])

  const resetFlow = useCallback(() => {
    // Clear all timers
    autoAdvanceTimers.current.forEach(timer => clearTimeout(timer))
    autoAdvanceTimers.current = []
    
    setFlowState('start')
    setUserInput('')
    setParsedStrategy(null)
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept keys when user is typing in an input/textarea
      const target = e.target as HTMLElement
      const isInputFocused = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable
      
      // Esc: Reset to start (always works)
      if (e.key === 'Escape') {
        resetFlow()
        return
      }

      // Don't intercept other keys if user is typing
      if (isInputFocused) {
        return
      }

      // Space: Advance to next step (if not in start/typing)
      if (e.key === ' ' && flowState !== 'start' && flowState !== 'typing') {
        e.preventDefault()
        advanceFlow()
        return
      }

      // Arrow keys: Navigate flow
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        advanceFlow()
        return
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        goBackFlow()
        return
      }

      // P: Toggle auto-advance (only when not typing)
      if (e.key === 'p' || e.key === 'P') {
        e.preventDefault()
        setAutoAdvance(prev => !prev)
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [flowState, autoAdvance, advanceFlow, goBackFlow, resetFlow])

  const handleInputSubmit = (input: string) => {
    // Landing page - do not process strategies, just display the concept
    // All navigation to parsing/execution pages is disabled
    return
  }

  // Calculate progress
  const currentIndex = FLOW_ORDER.indexOf(flowState)
  const progress = (currentIndex / (FLOW_ORDER.length - 1)) * 100

  return (
    <main className="relative w-full h-screen overflow-hidden" style={{ backgroundColor: '#0A0A0A' }}>
      {/* Particles background - very subtle */}
      {flowState === 'start' && <Particles />}
      
      {/* Navigation Controls (visible when not in start/typing) */}
      {(flowState !== 'start' && flowState !== 'typing') && (
        <div className="absolute top-8 right-4 z-50 flex items-center gap-2">
          <div className="bg-bloomberg-panel border border-terminal px-3 py-1.5 flex items-center gap-3 text-xs">
            <button
              onClick={goBackFlow}
              disabled={currentIndex === 0}
              className="px-2 py-1 bg-bloomberg-bg border border-terminal text-bloomberg-text hover:text-bloomberg-orange disabled:opacity-30 disabled:cursor-not-allowed font-mono uppercase"
            >
              ← BACK
            </button>
            <button
              onClick={advanceFlow}
              disabled={currentIndex === FLOW_ORDER.length - 1}
              className="px-2 py-1 bg-bloomberg-bg border border-terminal text-bloomberg-text hover:text-bloomberg-orange disabled:opacity-30 disabled:cursor-not-allowed font-mono uppercase"
            >
              NEXT →
            </button>
            <div className="w-px h-4 bg-terminal"></div>
            <button
              onClick={() => setAutoAdvance(!autoAdvance)}
              className={`px-2 py-1 border border-terminal font-mono uppercase text-[10px] ${
                autoAdvance 
                  ? 'bg-bloomberg-green text-bloomberg-bg' 
                  : 'bg-bloomberg-bg text-bloomberg-text-dim hover:text-bloomberg-text'
              }`}
            >
              AUTO: {autoAdvance ? 'ON' : 'OFF'}
            </button>
            <div className="w-px h-4 bg-terminal"></div>
            <button
              onClick={resetFlow}
              className="px-2 py-1 bg-bloomberg-bg border border-terminal text-bloomberg-red hover:bg-bloomberg-panel font-mono uppercase text-[10px]"
            >
              RESET
            </button>
          </div>
        </div>
      )}

      {/* Progress Indicator */}
      {(flowState !== 'start' && flowState !== 'typing') && (
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-bloomberg-panel border border-terminal px-4 py-1.5 flex items-center gap-3 text-xs">
            <div className="text-bloomberg-text-dim font-mono uppercase text-[10px]">
              {flowState.toUpperCase()}
            </div>
            <div className="w-32 h-1 bg-bloomberg-bg border border-terminal">
              <div 
                className="h-full bg-bloomberg-orange transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="text-bloomberg-text-dim font-mono text-[10px]">
              {Math.round(progress)}%
            </div>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Help (visible when not in start/typing) */}
      {(flowState !== 'start' && flowState !== 'typing') && (
        <div className="absolute bottom-2 right-4 z-50">
          <div className="bg-bloomberg-panel border-2 border-bloomberg-green px-4 py-2.5 text-xs font-mono shadow-lg">
            <div className="flex items-center gap-4 text-bloomberg-text">
              <div className="flex flex-col">
                <span className="text-bloomberg-green font-bold">← → Navigate</span>
                <div className="h-0.5 w-12 bg-bloomberg-green mt-0.5"></div>
              </div>
              <span className="text-bloomberg-green font-bold">SPACE Advance</span>
              <span className="text-bloomberg-red font-bold">ESC Reset</span>
              <span className="text-[#8B5CF6] font-bold">P Auto</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Terminal - visible during start, typing, parsing */}
      {(flowState === 'start' || flowState === 'typing' || flowState === 'parsing') && (
        <Terminal
          onSubmit={handleInputSubmit}
          flowState={flowState}
          userInput={userInput}
        />
      )}

      {/* Parsing Animation - brief transition overlay */}
      {flowState === 'parsing' && userInput && (
        <ParsingAnimation userInput={userInput} />
      )}

      {/* Strategy Spec - appears during spec state */}
      {flowState === 'spec' && parsedStrategy && (
        <StrategySpec 
          strategy={parsedStrategy} 
          onStrategyUpdate={(updated) => setParsedStrategy(updated)}
          autoAdvance={autoAdvance}
        />
      )}

      {/* Final Reveal - includes Backtest tab */}
      {flowState === 'reveal' && parsedStrategy && (
        <SentientReveal 
          userInput={userInput} 
          strategy={parsedStrategy} 
          onReset={resetFlow}
          onStrategyUpdate={(updated) => setParsedStrategy(updated)}
        />
      )}
    </main>
  )
}

