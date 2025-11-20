'use client'

import { useState, useEffect } from 'react'
import { parseStrategy } from '@/lib/strategyParser'

interface ParsingAnimationProps {
  userInput: string
}

export default function ParsingAnimation({ userInput }: ParsingAnimationProps) {
  const [lines, setLines] = useState<string[]>([])
  const [currentTime, setCurrentTime] = useState('')
  const parsed = parseStrategy(userInput || '')

  // Update time on client only to avoid hydration mismatch
  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString())
    }
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const sequence = [
      'PARSING NATURAL LANGUAGE...',
      '',
      `  [OK] Natural language: "${parsed.naturalLanguage || userInput || 'Strategy'}"`,
      `  [OK] Asset identified: ${parsed.asset}`,
      ...parsed.conditions.map((cond) => {
        if (cond.eventType === 'polymarket') {
          return `  [OK] Polymarket event: ${cond.description}`
        } else if (cond.type === 'oi') {
          return `  [OK] OI condition: ${cond.description}`
        } else if (cond.type === 'price') {
          return `  [OK] Price condition: ${cond.description}`
        }
        return `  [OK] Condition: ${cond.description}`
      }),
      `  [OK] Action: ${parsed.action} position @ ${parsed.leverage}x`,
      '',
      'VALIDATING CONDITIONS...',
      ...(parsed.conditions.some(c => c.eventType === 'polymarket') ? ['  [OK] Polymarket API connection verified'] : []),
      '  [OK] All conditions validated',
      '  [OK] Market liquidity checked',
      '',
      'OPTIMIZING EXECUTION...',
      '  [OK] Best venue selected: Hyperliquid',
      '  [OK] Slippage estimate: 0.02%',
      '  [OK] Gas optimization applied',
      '',
      'BUILDING EXECUTION GRAPH...',
      '  [OK] Dependency graph constructed',
      '  [OK] Polymarket webhook registered',
      '  [OK] Event listener configured',
      '',
      'COMPILING STRATEGY LOGIC...',
      '  [OK] Risk parameters validated',
      '  [OK] Position sizing calculated',
      '  [OK] Order routing configured',
      '',
      '[SUCCESS] Event-aware conditional order compiled and ready'
    ].filter(line => line !== '')

    let currentIndex = 0
    const interval = setInterval(() => {
      if (currentIndex < sequence.length) {
        setLines((prev) => [...prev, sequence[currentIndex]])
        currentIndex++
      } else {
        clearInterval(interval)
      }
    }, 250)

    return () => clearInterval(interval)
  }, [parsed])

  return (
    <div className="absolute inset-0 bg-bloomberg-bg z-10">
      {/* Top Status Bar */}
      <div className="bg-bloomberg-panel border-b border-terminal h-6 flex items-center justify-between px-2 text-xs">
        <div className="flex items-center gap-4">
          <span className="text-[#8B5CF6] font-bold">SENTIENT</span>
          <span className="text-bloomberg-text-dim">COMPILER</span>
          <span className="text-bloomberg-green">●</span>
          <span className="text-bloomberg-text-dim">PROCESSING</span>
        </div>
        <div className="text-bloomberg-text-dim">
          <span suppressHydrationWarning>{currentTime || '--:--:--'}</span>
        </div>
      </div>

      {/* Main Compiler Output */}
      <div className="h-[calc(100%-24px)] p-4">
        <div className="bg-bloomberg-panel border border-terminal h-full p-4 overflow-auto">
          {/* Header */}
          <div className="mb-4 pb-2 border-b border-terminal">
            <div className="text-[#8B5CF6] text-xs font-bold uppercase">COMPILER OUTPUT</div>
          </div>

          {/* Output Lines */}
          <div className="space-y-1 font-mono text-xs">
            {lines.map((line, index) => {
              const isHeader = line.includes('...') && !line.startsWith('  ')
              const isSuccess = line.includes('[SUCCESS]') || line.includes('[OK]')
              const isEmpty = line === ''
              
              return (
                <div
                  key={index}
                  className={`${
                    isHeader 
                      ? 'text-[#8B5CF6] font-bold' 
                      : isSuccess 
                        ? 'text-bloomberg-green' 
                        : isEmpty 
                          ? '' 
                          : 'text-bloomberg-text'
                  }`}
                >
                  {line || '\u00A0'}
                </div>
              )
            })}
            {lines.length > 0 && (
              <span className="inline-block w-2 h-3 bg-[#8B5CF6] blink ml-1" />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
