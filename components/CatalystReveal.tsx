'use client'

import { useState, useEffect } from 'react'
import { ParsedStrategy } from '@/lib/strategyParser'
import { getUIAdaptations } from '@/lib/strategyType'
import Simulation from './Simulation'

interface SentientRevealProps {
  userInput: string
  strategy: ParsedStrategy
  onReset?: () => void
  onStrategyUpdate?: (updated: ParsedStrategy) => void
}

export default function SentientReveal({ userInput, strategy, onReset, onStrategyUpdate }: SentientRevealProps) {
  const [currentTime, setCurrentTime] = useState('')
  const [activeTab, setActiveTab] = useState<'monitoring' | 'backtest' | 'positions'>('monitoring')
  const [stopLoss, setStopLoss] = useState(String(strategy.stopLoss))
  const [takeProfit, setTakeProfit] = useState(String(strategy.takeProfit))
  const [leverage, setLeverage] = useState(String(strategy.leverage || 2))
  const [accountSize, setAccountSize] = useState('250000')
  
  // Check if this is position management
  const isPositionManagement = strategy.isPositionManagement || false
  const positionAction = strategy.positionAction

  // Get UI adaptations based on strategy type
  const uiAdaptations = getUIAdaptations(strategy)
  const hasPolymarket = uiAdaptations.typeInfo.hasPolymarket
  const hasMetrics = uiAdaptations.typeInfo.hasMetrics

  // Update local state when strategy prop changes
  useEffect(() => {
    setStopLoss(String(strategy.stopLoss))
    setTakeProfit(String(strategy.takeProfit))
    setLeverage(String(strategy.leverage || 2))
  }, [strategy])

  // Update parent when values change
  useEffect(() => {
    if (onStrategyUpdate) {
      const timeoutId = setTimeout(() => {
        const stopLossNum = parseFloat(stopLoss)
        const takeProfitNum = parseFloat(takeProfit)
        const leverageNum = parseInt(leverage)
        
        // Only update if values are valid
        if (!isNaN(stopLossNum) && !isNaN(takeProfitNum) && !isNaN(leverageNum)) {
          const updated = {
            ...strategy,
            stopLoss: stopLossNum,
            takeProfit: takeProfitNum,
            leverage: leverageNum
          }
          onStrategyUpdate(updated)
        }
      }, 300)
      return () => clearTimeout(timeoutId)
    }
  }, [stopLoss, takeProfit, leverage, onStrategyUpdate, strategy])

  // Update time on client only to avoid hydration mismatch
  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString())
    }
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  // Keyboard shortcut for tab switching (F3 cycles through tabs)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F3') {
        e.preventDefault()
        setActiveTab(prev => {
          if (prev === 'monitoring') return 'backtest'
          if (prev === 'backtest') return 'positions'
          return 'monitoring'
        })
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Convert strings to numbers for calculations
  const stopLossNum = parseFloat(stopLoss) || strategy.stopLoss || 2
  const takeProfitNum = parseFloat(takeProfit) || strategy.takeProfit || 5
  const leverageNum = parseInt(leverage) || strategy.leverage || 2
  const accountSizeNum = parseFloat(accountSize) || 250000
  return (
    <div className="absolute inset-0 bg-bloomberg-bg z-30">
      {/* Top Status Bar */}
      <div className="bg-bloomberg-panel border-b border-terminal h-6 flex items-center justify-between px-2 text-xs">
        <div className="flex items-center gap-4">
          <span className="text-[#8B5CF6] font-bold">SENTIENT TERMINAL</span>
          <span className="text-bloomberg-text-dim">{uiAdaptations.strategyLabel}</span>
          <span className="text-bloomberg-green">●</span>
          <span className="text-bloomberg-text-dim">READY TO DEPLOY</span>
        </div>
        <div className="flex items-center gap-4 text-bloomberg-text-dim">
          <span>USER: TRADER_001</span>
          <span>|</span>
          <span suppressHydrationWarning>{currentTime || '--:--:--'}</span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-bloomberg-panel border-b border-terminal h-8 flex items-center gap-1 px-2">
        <button
          onClick={() => setActiveTab('monitoring')}
          className={`px-4 py-1 text-xs font-mono uppercase border-b-2 transition-colors ${
            activeTab === 'monitoring'
              ? 'border-[#8B5CF6] text-[#8B5CF6] font-bold'
              : 'border-transparent text-bloomberg-text-dim hover:text-bloomberg-text'
          }`}
        >
          LIVE MONITORING
        </button>
        <button
          onClick={() => setActiveTab('backtest')}
          className={`px-4 py-1 text-xs font-mono uppercase border-b-2 transition-colors ${
            activeTab === 'backtest'
              ? 'border-[#8B5CF6] text-[#8B5CF6] font-bold'
              : 'border-transparent text-bloomberg-text-dim hover:text-bloomberg-text'
          }`}
        >
          BACKTEST
        </button>
        <button
          onClick={() => setActiveTab('positions')}
          className={`px-4 py-1 text-xs font-mono uppercase border-b-2 transition-colors ${
            activeTab === 'positions'
              ? 'border-[#8B5CF6] text-[#8B5CF6] font-bold'
              : 'border-transparent text-bloomberg-text-dim hover:text-bloomberg-text'
          }`}
        >
          POSITIONS
        </button>
      </div>

      {/* Main Terminal Grid - Conditional based on tab */}
      {activeTab === 'monitoring' ? (
        <div className="h-[calc(100%-86px)] grid grid-cols-5 grid-rows-2 gap-1 p-1">
        {/* Panel 1: Condition Status (Adapted based on strategy type) */}
        <div className="bg-bloomberg-panel border border-terminal flex flex-col">
          <div className="bg-bloomberg-bg border-b border-terminal px-2 py-1">
            <div className="text-bloomberg-orange text-xs font-bold uppercase">
              {isPositionManagement 
                ? 'EXIT CONDITION STATUS'
                : hasPolymarket ? 'EVENT & CONDITION STATUS' : 'CONDITION STATUS'
              }
            </div>
          </div>
          <div className="flex-1 p-3 overflow-auto">
            <div className="space-y-2 text-xs font-mono">
              {/* Polymarket Event Info (if applicable) */}
              {hasPolymarket && strategy.conditions.find(c => c.eventType === 'polymarket') && (() => {
                const eventCond = strategy.conditions.find(c => c.eventType === 'polymarket')!
                const currentProb = 68.5 // Simulated
                const targetProb = typeof eventCond.probability === 'number' ? eventCond.probability : 70
                const isMet = currentProb >= targetProb
                const marketName = eventCond.description.replace('Polymarket: ', '').split(' probability')[0]
                
                return (
                  <div className="border border-terminal p-2 bg-bloomberg-bg mb-2">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[#8B5CF6] text-[8px]">●</span>
                      <span className="text-[#8B5CF6] text-[9px] font-bold">POLYMARKET EVENT</span>
                    </div>
                    <div className="text-bloomberg-text text-[10px] mb-1">{marketName}</div>
                    <div className="grid grid-cols-2 gap-2 mb-1">
                      <div>
                        <div className="text-bloomberg-text-dim text-[8px]">CURRENT PROB</div>
                        <div className={`text-[10px] font-bold ${isMet ? 'text-bloomberg-green' : 'text-bloomberg-text'}`}>
                          {currentProb.toFixed(1)}%
                        </div>
                      </div>
                      <div>
                        <div className="text-bloomberg-text-dim text-[8px]">TARGET</div>
                        <div className="text-bloomberg-text text-[10px] font-bold">{targetProb}%</div>
                      </div>
                    </div>
                    <div className="w-full h-1 bg-bloomberg-bg border border-terminal mb-1">
                      <div
                        className={`h-full ${isMet ? 'bg-bloomberg-green' : 'bg-[#8B5CF6]'}`}
                        style={{ width: `${Math.min(100, (currentProb / targetProb) * 100)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[8px]">
                      <span className="text-bloomberg-text-dim">Status:</span>
                      <span className={`font-bold ${isMet ? 'text-bloomberg-green' : 'text-bloomberg-text-dim'}`}>
                        {isMet ? '● TRIGGERED' : '○ PENDING'}
                      </span>
                    </div>
                    {uiAdaptations.showEventDeadline && (
                      <div className="mt-1 pt-1 border-t border-terminal text-[8px] text-bloomberg-text-dim">
                        Resolution: Dec 31, 2024 23:59 UTC
                      </div>
                    )}
                  </div>
                )
              })()}
              
              {/* Additional Conditions (OI, Price, or additional Polymarket events) */}
              {strategy.conditions.filter((cond, idx) => idx > 0 || !hasPolymarket).map((cond, i) => {
                let isMet = false
                let value = ''
                let color = 'text-bloomberg-green'
                
                if (cond.eventType === 'polymarket') {
                  const currentProb = 68.5 + (i * 2.3)
                  const targetProb = typeof cond.probability === 'number' ? cond.probability : 70
                  isMet = currentProb >= targetProb
                  value = `${currentProb.toFixed(1)}%`
                  color = 'text-[#8B5CF6]'
                } else if (cond.type === 'oi') {
                  const threshold = typeof cond.value === 'number' ? cond.value : 5
                  const current = 3.2 + Math.random() * 1.5
                  isMet = current >= threshold
                  value = `+${current.toFixed(1)}%`
                } else if (cond.type === 'price') {
                  const threshold = typeof cond.value === 'number' ? cond.value : 3200
                  const current = threshold * (0.95 + Math.random() * 0.05)
                  isMet = cond.description.includes('above') ? current >= threshold : current <= threshold
                  value = `$${current.toFixed(0)}`
                }
                
                return (
                  <div key={i} className="border border-terminal p-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[9px] ${color}`}>{cond.description}</span>
                      <span className={`text-[10px] font-bold ${isMet ? 'text-bloomberg-green' : 'text-bloomberg-red'}`}>
                        {isMet ? '● MET' : '○ NOT MET'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-bloomberg-text text-[10px]">{value}</span>
                      <span className={`text-[10px] ${isMet ? 'text-bloomberg-green' : 'text-bloomberg-text-dim'}`}>
                        ↑
                      </span>
                    </div>
                  </div>
                )
              })}
              <div className="pt-2 mt-2 border-t border-terminal">
                <div className="text-bloomberg-text-dim text-[9px] mb-1">
                  {isPositionManagement ? 'EXIT ACTION' : 'ACTION'}
                </div>
                {isPositionManagement ? (
                  <div className={`text-[10px] font-bold ${
                    positionAction === 'CLOSE' ? 'text-bloomberg-red' :
                    positionAction === 'REVERSE' ? 'text-bloomberg-orange' :
                    'text-bloomberg-text-dim'
                  }`}>
                    {positionAction === 'CLOSE' ? '● CLOSE POSITION' :
                     positionAction === 'REVERSE' ? '● REVERSE POSITION' :
                     '● CANCEL POSITION'}
                  </div>
                ) : (
                  <div className="text-bloomberg-green text-[10px]">
                    {strategy.action} {strategy.asset} @ {leverageNum}x
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Panel 2: Live Signals / Event Monitoring (Adapted) */}
        <div className="bg-bloomberg-panel border border-terminal flex flex-col">
          <div className="bg-bloomberg-bg border-b border-terminal px-2 py-1">
            <div className="text-bloomberg-orange text-xs font-bold uppercase">
              {isPositionManagement 
                ? 'EXIT MONITORING'
                : hasPolymarket ? 'EVENT MONITORING' : 'LIVE SIGNALS'
              }
            </div>
          </div>
          <div className="flex-1 p-3 overflow-auto">
            <div className="space-y-2 text-xs font-mono">
              {/* Event-specific monitoring (if Polymarket) */}
              {hasPolymarket && (
                <>
                  <div>
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-bloomberg-text-dim text-[9px]">MARKET PROBABILITY</span>
                      <span className="text-[#8B5CF6] text-[10px] font-bold">68.5%</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1 text-[8px] text-bloomberg-text-dim">
                      <div>1h: <span className="text-bloomberg-green">+2.1%</span> ↑</div>
                      <div>24h: <span className="text-bloomberg-green">+5.3%</span> ↑</div>
                      <div>7d: <span className="text-bloomberg-green">+12.4%</span> ↑</div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-bloomberg-text-dim text-[9px]">VOLUME (24h)</span>
                      <span className="text-bloomberg-text text-[10px]">$1.2M</span>
                    </div>
                    <div className="text-bloomberg-text-dim text-[8px]">Market liquidity</div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-bloomberg-text-dim text-[9px]">TIME TO RESOLUTION</span>
                      <span className="text-bloomberg-text text-[10px]">12d 4h</span>
                    </div>
                    <div className="text-bloomberg-text-dim text-[8px]">Countdown to event</div>
                  </div>
                </>
              )}
              
              {/* OI monitoring (if OI condition exists) */}
              {strategy.conditions.some(c => c.eventType === 'oi') && (
                <div>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-bloomberg-text-dim text-[9px]">OI CHANGE</span>
                    <span className="text-bloomberg-green text-[10px]">+3.2%</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 text-[8px] text-bloomberg-text-dim">
                    <div>1h: <span className="text-bloomberg-green">+0.8%</span> ↑</div>
                    <div>24h: <span className="text-bloomberg-green">+2.1%</span> ↑</div>
                    <div>7d: <span className="text-bloomberg-green">+5.4%</span> ↑</div>
                  </div>
                </div>
              )}

              {/* Asset Price Context (always show for reference) */}
              <div>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-bloomberg-text-dim text-[9px]">ASSET PRICE</span>
                  <span className="text-bloomberg-text text-[10px]">$3,115.42</span>
                </div>
                <div className="grid grid-cols-3 gap-1 text-[8px] text-bloomberg-text-dim">
                  <div>1h: <span className="text-bloomberg-green">+0.3%</span> ↑</div>
                  <div>24h: <span className="text-bloomberg-green">+2.4%</span> ↑</div>
                  <div>7d: <span className="text-bloomberg-green">+5.8%</span> ↑</div>
                </div>
              </div>
              
              {/* Exit Condition Progress (for position management) */}
              {isPositionManagement && strategy.conditions.length > 0 && (
                <div className="pt-2 mt-2 border-t border-terminal space-y-2">
                  <div className="text-bloomberg-text-dim text-[9px] mb-1">EXIT CONDITION PROGRESS</div>
                  {strategy.conditions.map((cond, i) => {
                    // Mock progress calculation
                    let current = 0
                    let threshold = 0
                    let progress = 0
                    let timeEstimate = ''
                    
                    if (cond.eventType === 'polymarket') {
                      current = 68.5 + (i * 2.3)
                      threshold = typeof cond.probability === 'number' ? cond.probability : 75
                      progress = Math.min(100, ((current - 50) / (threshold - 50)) * 100) // Baseline 50%
                      const velocity = 0.5 // % per hour
                      const remaining = Math.max(0, threshold - current)
                      const hours = remaining / velocity
                      timeEstimate = hours < 1 ? '< 1h' : hours < 24 ? `${Math.round(hours)}h` : `${Math.round(hours / 24)}d`
                    } else if (cond.type === 'oi') {
                      current = 3.2
                      threshold = typeof cond.value === 'number' ? cond.value : 5
                      progress = Math.min(100, (current / threshold) * 100)
                      timeEstimate = '2-4h'
                    } else if (cond.type === 'price') {
                      current = 3115.42
                      threshold = typeof cond.value === 'number' ? cond.value : 3500
                      progress = Math.min(100, ((current - 2800) / (threshold - 2800)) * 100)
                      timeEstimate = '4-6h'
                    }
                    
                    const isMet = progress >= 100
                    
                    return (
                      <div key={i} className="border border-terminal p-1.5 bg-bloomberg-bg">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[8px] text-bloomberg-text">
                            {cond.eventType === 'polymarket' ? '●' : '○'} {cond.description}
                          </span>
                          <span className={`text-[8px] font-bold ${
                            isMet ? 'text-bloomberg-green' : 'text-bloomberg-text-dim'
                          }`}>
                            {isMet ? 'MET' : `${Math.round(progress)}%`}
                          </span>
                        </div>
                        <div className="w-full h-1 bg-bloomberg-bg border border-terminal mb-1">
                          <div 
                            className={`h-full transition-all ${
                              isMet ? 'bg-bloomberg-green' : 'bg-bloomberg-orange'
                            }`}
                            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[7px] text-bloomberg-text-dim">
                          <span>Current: {cond.eventType === 'polymarket' ? `${current.toFixed(1)}%` : cond.type === 'price' ? `$${current.toFixed(0)}` : `${current.toFixed(1)}%`}</span>
                          <span>Est. time: {timeEstimate}</span>
                        </div>
                      </div>
                    )
                  })}
                  <div className="pt-1 border-t border-terminal">
                    <div className="text-bloomberg-text-dim text-[8px]">
                      Exit logic: {strategy.exitLogic === 'ANY' ? 'ANY condition' : 'ALL conditions'} must be met
                    </div>
                  </div>
                </div>
              )}
              
              <div className="pt-2 mt-2 border-t border-terminal">
                <div className={`flex items-center gap-1 mb-0.5 ${
                  isPositionManagement 
                    ? (positionAction === 'CLOSE' ? 'text-bloomberg-red' : positionAction === 'REVERSE' ? 'text-bloomberg-orange' : 'text-bloomberg-text-dim')
                    : hasPolymarket ? 'text-[#8B5CF6]' : 'text-bloomberg-green'
                }`}>
                  <span>●</span>
                  <span className="text-[9px] font-bold">
                    {isPositionManagement 
                      ? `MONITORING ${positionAction} CONDITIONS`
                      : hasPolymarket ? 'MONITORING EVENT' : 'READY TO TRIGGER'
                    }
                  </span>
                </div>
                <div className="text-bloomberg-text-dim text-[8px]">
                  {strategy.conditions.filter((_, i) => i === 0 || i === 1).length}/{strategy.conditions.length} {isPositionManagement ? 'exit' : ''} conditions met
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Panel 3: Current Position Status (Read-only) */}
        <div className="bg-bloomberg-panel border border-terminal flex flex-col">
          <div className="bg-bloomberg-bg border-b border-terminal px-2 py-1">
            <div className="text-[#8B5CF6] text-xs font-bold uppercase">
              {isPositionManagement ? 'POSITION BEING MANAGED' : 'CURRENT POSITION'}
            </div>
          </div>
          <div className="flex-1 p-3 overflow-auto">
            <div className="space-y-2 text-xs font-mono">
              {isPositionManagement ? (
                <>
                  {/* Position Details for Position Management */}
                  <div>
                    <div className="text-bloomberg-text-dim text-[9px] mb-0.5">POSITION ID</div>
                    <div className="text-bloomberg-text text-[10px] font-bold">{strategy.positionId || 'pos-001'}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-bloomberg-text-dim text-[9px] mb-0.5">ASSET</div>
                      <div className="text-bloomberg-text text-[10px] font-bold">{strategy.asset}</div>
                    </div>
                    <div>
                      <div className="text-bloomberg-text-dim text-[9px] mb-0.5">DIRECTION</div>
                      <div className={`text-[10px] font-bold ${
                        strategy.action === 'LONG' ? 'text-bloomberg-green' : 'text-bloomberg-red'
                      }`}>
                        {strategy.action}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-terminal">
                    <div>
                      <div className="text-bloomberg-text-dim text-[9px] mb-0.5">ENTRY PRICE</div>
                      <div className="text-bloomberg-text text-[10px] font-bold">$3,115.42</div>
                    </div>
                    <div>
                      <div className="text-bloomberg-text-dim text-[9px] mb-0.5">CURRENT PRICE</div>
                      <div className="text-bloomberg-text text-[10px] font-bold">$3,187.23</div>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-terminal">
                    <div className="text-bloomberg-text-dim text-[9px] mb-0.5">POSITION SIZE</div>
                    <div className="text-bloomberg-text text-[11px] font-bold">$5,000</div>
                    <div className="text-bloomberg-text-dim text-[8px] mt-0.5">Notional: $15,000 (3x)</div>
                  </div>
                  <div>
                    <div className="text-bloomberg-text-dim text-[9px] mb-0.5">TIME IN POSITION</div>
                    <div className="text-bloomberg-text text-[10px]">2h 15m</div>
                  </div>
                  <div className="pt-2 border-t border-terminal">
                    <div className="text-bloomberg-text-dim text-[9px] mb-0.5">CURRENT UNREALIZED P&L</div>
                    <div className="text-bloomberg-green text-[11px] font-bold">+$1,076.50</div>
                    <div className="text-bloomberg-text-dim text-[8px] mt-0.5">+2.3% return</div>
                  </div>
                  {strategy.positionSize && strategy.positionSize < 100 && (
                    <div className="pt-2 border-t border-terminal">
                      <div className="text-bloomberg-text-dim text-[9px] mb-0.5">CLOSE SIZE</div>
                      <div className="text-bloomberg-orange text-[11px] font-bold">{strategy.positionSize}%</div>
                      <div className="text-bloomberg-text-dim text-[8px] mt-0.5">
                        ${(5000 * strategy.positionSize / 100).toFixed(0)} will be closed
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div>
                    <div className="text-bloomberg-text-dim text-[9px] mb-0.5">STATUS</div>
                    <div className="text-bloomberg-green text-[11px] font-bold">● ACTIVE</div>
                    <div className="text-bloomberg-text-dim text-[8px] mt-0.5">Awaiting trigger</div>
                  </div>
                  <div className="pt-2 border-t border-terminal">
                    <div className="text-bloomberg-text-dim text-[9px] mb-0.5">POSITION SIZE</div>
                    <div className="text-bloomberg-text text-[11px] font-bold">
                      ${(accountSizeNum * stopLossNum / 100).toFixed(0)}
                    </div>
                    <div className="text-bloomberg-text-dim text-[8px] mt-0.5">
                      {stopLossNum}% of ${accountSizeNum.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-bloomberg-text-dim text-[9px] mb-0.5">NOTIONAL</div>
                    <div className="text-bloomberg-text text-[11px] font-bold">
                      ${(accountSizeNum * stopLossNum / 100 * leverageNum).toFixed(0)}
                    </div>
                    <div className="text-bloomberg-text-dim text-[8px] mt-0.5">
                      {leverageNum}x leverage
                    </div>
                  </div>
                  <div className="pt-2 border-t border-terminal">
                    <div className="text-bloomberg-text-dim text-[9px] mb-0.5">RISK PARAMETERS</div>
                    <div className="space-y-0.5 text-[10px]">
                      <div className="flex justify-between">
                        <span className="text-bloomberg-text-dim">Stop Loss:</span>
                        <span className="text-bloomberg-red">-{stopLossNum}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-bloomberg-text-dim">Take Profit:</span>
                        <span className="text-bloomberg-green">+{takeProfitNum}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-bloomberg-text-dim">Risk/Reward:</span>
                        <span className="text-bloomberg-text">1:{(takeProfitNum / stopLossNum).toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-terminal">
                    <div className="text-bloomberg-text-dim text-[9px] mb-0.5">CAPITAL AT RISK</div>
                    <div className="text-bloomberg-red text-[11px] font-bold">
                      ${(accountSizeNum * stopLossNum / 100).toFixed(0)}
                    </div>
                    <div className="text-bloomberg-text-dim text-[8px] mt-0.5">Max loss if stop hit</div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Panel 4: Real-Time P&L */}
        <div className="bg-bloomberg-panel border border-terminal flex flex-col">
          <div className="bg-bloomberg-bg border-b border-terminal px-2 py-1">
            <div className="text-[#8B5CF6] text-xs font-bold uppercase">
              {isPositionManagement ? 'REALIZED P&L PREVIEW' : 'LIVE P&L'}
            </div>
          </div>
          <div className="flex-1 p-3 overflow-auto">
            <div className="space-y-2 text-xs font-mono">
              {isPositionManagement ? (
                <>
                  {/* Realized P&L Preview for Position Management */}
                  <div>
                    <div className="text-bloomberg-text-dim text-[9px] mb-0.5">CURRENT UNREALIZED</div>
                    <div className="text-bloomberg-green text-[11px] font-bold">+$1,076.50</div>
                    <div className="text-bloomberg-text-dim text-[8px] mt-0.5">Mark-to-market</div>
                  </div>
                  <div className="pt-2 border-t border-terminal">
                    <div className="text-bloomberg-text-dim text-[9px] mb-0.5">WILL BE REALIZED</div>
                    <div className={`text-[11px] font-bold ${
                      positionAction === 'CLOSE' ? 'text-bloomberg-green' :
                      positionAction === 'REVERSE' ? 'text-bloomberg-orange' :
                      'text-bloomberg-text-dim'
                    }`}>
                      {(() => {
                        const closeSize = strategy.positionSize || 100
                        const realizedPnl = 1076.50 * (closeSize / 100)
                        return positionAction === 'CLOSE' 
                          ? `+$${realizedPnl.toFixed(2)}`
                          : positionAction === 'REVERSE'
                          ? `-$${realizedPnl.toFixed(2)}`
                          : '$0.00'
                      })()}
                    </div>
                    <div className="text-bloomberg-text-dim text-[8px] mt-0.5">
                      {strategy.positionSize && strategy.positionSize < 100 
                        ? `${strategy.positionSize}% of position`
                        : '100% of position'}
                    </div>
                  </div>
                  {strategy.positionSize && strategy.positionSize < 100 && (
                    <div>
                      <div className="text-bloomberg-text-dim text-[9px] mb-0.5">REMAINING POSITION</div>
                      <div className="text-bloomberg-text text-[10px]">
                        ${(5000 * (100 - strategy.positionSize) / 100).toFixed(0)}
                      </div>
                      <div className="text-bloomberg-text-dim text-[8px] mt-0.5">
                        ${(1076.50 * (100 - strategy.positionSize) / 100).toFixed(2)} unrealized
                      </div>
                    </div>
                  )}
                  <div className="pt-2 border-t border-terminal">
                    <div className="text-bloomberg-text-dim text-[9px] mb-0.5">PORTFOLIO IMPACT</div>
                    <div className="text-bloomberg-text text-[10px]">
                      {(() => {
                        const closeSize = strategy.positionSize || 100
                        const capitalReleased = 5000 * (closeSize / 100)
                        return `${((capitalReleased / accountSizeNum) * 100).toFixed(1)}% of portfolio`
                      })()}
                    </div>
                    <div className="text-bloomberg-text-dim text-[8px] mt-0.5">
                      ${(5000 * ((strategy.positionSize || 100) / 100)).toFixed(0)} capital released
                    </div>
                  </div>
                  <div>
                    <div className="text-bloomberg-text-dim text-[9px] mb-0.5">REALIZED TODAY</div>
                    <div className="text-bloomberg-green text-[10px]">+$0.00</div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <div className="text-bloomberg-text-dim text-[9px] mb-0.5">UNREALIZED</div>
                    <div className="text-bloomberg-green text-[11px] font-bold">
                      +${((accountSizeNum * stopLossNum / 100) * leverageNum * (takeProfitNum * 0.6) / 100).toFixed(2)}
                    </div>
                    <div className="text-bloomberg-text-dim text-[8px] mt-0.5">Mark-to-market</div>
                  </div>
                  <div>
                    <div className="text-bloomberg-text-dim text-[9px] mb-0.5">REALIZED</div>
                    <div className="text-bloomberg-green text-[11px] font-bold">+$0.00</div>
                    <div className="text-bloomberg-text-dim text-[8px] mt-0.5">Closed today</div>
                  </div>
                  <div className="pt-2 border-t border-terminal">
                    <div className="text-bloomberg-text-dim text-[9px] mb-0.5">DAILY P&L</div>
                    <div className="text-bloomberg-green text-[11px] font-bold">
                      +${((accountSizeNum * stopLossNum / 100) * leverageNum * (takeProfitNum * 0.6) / 100).toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-bloomberg-text-dim text-[9px] mb-0.5">SINCE ENTRY</div>
                    <div className="text-bloomberg-green text-[11px] font-bold">
                      +${((accountSizeNum * stopLossNum / 100) * leverageNum * (takeProfitNum * 0.6) / 100).toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-bloomberg-text-dim text-[9px] mb-0.5">ROI</div>
                    <div className="text-bloomberg-green text-[11px] font-bold">
                      +{((takeProfitNum * 0.6) * leverageNum).toFixed(2)}%
                    </div>
                    <div className="text-bloomberg-text-dim text-[8px] mt-0.5">Return on capital</div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Panel 5: Risk Limits & VaR */}
        <div className="bg-bloomberg-panel border border-terminal flex flex-col">
          <div className="bg-bloomberg-bg border-b border-terminal px-2 py-1">
            <div className="text-bloomberg-orange text-xs font-bold uppercase">RISK LIMITS</div>
          </div>
          <div className="flex-1 p-3 overflow-auto">
            <div className="space-y-2 text-xs font-mono">
              <div>
                <div className="text-bloomberg-text-dim text-[9px] mb-0.5">POSITION LIMIT</div>
                <div className="text-bloomberg-text text-[10px]">$50,000</div>
                <div className="text-bloomberg-text-dim text-[8px] mt-0.5">
                  Current: ${(accountSizeNum * stopLossNum / 100).toFixed(0)} ({((accountSizeNum * stopLossNum / 100) / 50000 * 100).toFixed(0)}%)
                </div>
              </div>
              <div>
                <div className="text-bloomberg-text-dim text-[9px] mb-0.5">VaR (1d, 95%)</div>
                <div className="text-bloomberg-red text-[11px] font-bold">
                  ${(accountSizeNum * stopLossNum / 100 * 1.65).toFixed(0)}
                </div>
                <div className="text-bloomberg-text-dim text-[8px] mt-0.5">Value at Risk</div>
              </div>
              <div>
                <div className="text-bloomberg-text-dim text-[9px] mb-0.5">MAX DRAWDOWN</div>
                <div className="text-bloomberg-red text-[10px]">-{stopLossNum}%</div>
                <div className="text-bloomberg-text-dim text-[8px] mt-0.5">Limit: -5.0%</div>
              </div>
              <div>
                <div className="text-bloomberg-text-dim text-[9px] mb-0.5">EXPOSURE</div>
                <div className="text-bloomberg-text text-[10px]">
                  ${(accountSizeNum * stopLossNum / 100 * leverageNum).toFixed(0)}
                </div>
                <div className="text-bloomberg-text-dim text-[8px] mt-0.5">Notional</div>
              </div>
              <div>
                <div className="text-bloomberg-text-dim text-[9px] mb-0.5">LEVERAGE</div>
                <div className="text-bloomberg-text text-[10px]">{leverageNum}x</div>
                <div className="text-bloomberg-text-dim text-[8px] mt-0.5">Limit: 10x</div>
              </div>
              <div className="pt-2 border-t border-terminal">
                <div className="text-bloomberg-text-dim text-[9px] mb-0.5">STATUS</div>
                <div className="text-bloomberg-green text-[10px] font-bold">● SAFE</div>
                <div className="text-bloomberg-text-dim text-[8px] mt-0.5">All limits OK</div>
              </div>
            </div>
          </div>
        </div>

        {/* Panel 6: Advanced Performance Metrics (Hidden for position management) */}
        {!isPositionManagement && (
        <div className="bg-bloomberg-panel border border-terminal flex flex-col col-span-3">
          <div className="bg-bloomberg-bg border-b border-terminal px-2 py-1">
            <div className="text-[#8B5CF6] text-xs font-bold uppercase">PERFORMANCE ANALYTICS</div>
          </div>
          <div className="flex-1 p-3 overflow-auto">
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="space-y-2">
                <div>
                  <div className="text-bloomberg-text-dim text-[9px] mb-0.5">SHARPE RATIO</div>
                  <div className="text-bloomberg-text text-[11px] font-bold">2.34</div>
                  <div className="text-bloomberg-text-dim text-[8px] mt-0.5">Risk-adjusted return</div>
                </div>
                <div>
                  <div className="text-bloomberg-text-dim text-[9px] mb-0.5">SORTINO RATIO</div>
                  <div className="text-bloomberg-text text-[11px] font-bold">3.12</div>
                  <div className="text-bloomberg-text-dim text-[8px] mt-0.5">Downside risk only</div>
                </div>
                <div>
                  <div className="text-bloomberg-text-dim text-[9px] mb-0.5">CALMAR RATIO</div>
                  <div className="text-bloomberg-text text-[11px] font-bold">1.87</div>
                  <div className="text-bloomberg-text-dim text-[8px] mt-0.5">Return / Max DD</div>
                </div>
                <div>
                  <div className="text-bloomberg-text-dim text-[9px] mb-0.5">INFO RATIO</div>
                  <div className="text-bloomberg-text text-[11px] font-bold">1.45</div>
                  <div className="text-bloomberg-text-dim text-[8px] mt-0.5">Alpha / Tracking error</div>
                </div>
              </div>
              <div className="space-y-2">
                <div>
                  <div className="text-bloomberg-text-dim text-[9px] mb-0.5">WIN RATE</div>
                  <div className="text-bloomberg-green text-[11px] font-bold">75.0%</div>
                </div>
                <div>
                  <div className="text-bloomberg-text-dim text-[9px] mb-0.5">AVG WIN</div>
                  <div className="text-bloomberg-green text-[11px] font-bold">+{takeProfitNum.toFixed(1)}%</div>
                </div>
                <div>
                  <div className="text-bloomberg-text-dim text-[9px] mb-0.5">AVG LOSS</div>
                  <div className="text-bloomberg-red text-[11px] font-bold">-{stopLossNum.toFixed(1)}%</div>
                </div>
                <div>
                  <div className="text-bloomberg-text-dim text-[9px] mb-0.5">PROFIT FACTOR</div>
                  <div className="text-bloomberg-text text-[11px] font-bold">
                    {(takeProfitNum / stopLossNum).toFixed(2)}
                  </div>
                  <div className="text-bloomberg-text-dim text-[8px] mt-0.5">Avg Win / Avg Loss</div>
                </div>
                <div>
                  <div className="text-bloomberg-text-dim text-[9px] mb-0.5">EXPECTANCY</div>
                  <div className="text-bloomberg-green text-[11px] font-bold">
                    +{((takeProfitNum * 0.75) - (stopLossNum * 0.25)).toFixed(2)}%
                  </div>
                  <div className="text-bloomberg-text-dim text-[8px] mt-0.5">Expected value/trade</div>
                </div>
                <div>
                  <div className="text-bloomberg-text-dim text-[9px] mb-0.5">MAX CONSEC LOSSES</div>
                  <div className="text-bloomberg-red text-[11px] font-bold">3</div>
                </div>
                <div>
                  <div className="text-bloomberg-text-dim text-[9px] mb-0.5">MAX CONSEC WINS</div>
                  <div className="text-bloomberg-green text-[11px] font-bold">12</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Panel 7: Execution Quality (Hidden for position management) */}
        {!isPositionManagement && (
        <div className="bg-bloomberg-panel border border-terminal flex flex-col col-span-2">
          <div className="bg-bloomberg-bg border-b border-terminal px-2 py-1">
            <div className="text-bloomberg-orange text-xs font-bold uppercase">EXECUTION</div>
          </div>
          <div className="flex-1 p-3 overflow-auto">
            <div className="space-y-2 text-xs font-mono">
              <div>
                <div className="text-bloomberg-text-dim text-[9px] mb-0.5">ROUTING</div>
                <div className="text-bloomberg-text text-[10px]">Hyperliquid (Primary)</div>
                <div className="text-bloomberg-text-dim text-[8px] mt-0.5">Fallback: Lighter, Decibel</div>
              </div>
              <div>
                <div className="text-bloomberg-text-dim text-[9px] mb-0.5">LATENCY</div>
                <div className="text-bloomberg-green text-[10px]">12ms avg</div>
                <div className="text-bloomberg-text-dim text-[8px] mt-0.5">P99: 28ms</div>
              </div>
              <div className="pt-2 border-t border-terminal">
                <div className="text-bloomberg-text-dim text-[9px] mb-1">QUALITY</div>
                <div className="space-y-1 text-[10px]">
                  <div className="flex justify-between">
                    <span className="text-bloomberg-text-dim">Avg Slippage:</span>
                    <span className="text-bloomberg-text">0.02%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-bloomberg-text-dim">Fill Rate:</span>
                    <span className="text-bloomberg-green">98.5%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-bloomberg-text-dim">Reject Rate:</span>
                    <span className="text-bloomberg-text-dim">1.5%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-bloomberg-text-dim">Market Impact:</span>
                    <span className="text-bloomberg-text">0.05%</span>
                  </div>
                </div>
              </div>
              <div className="pt-2 border-t border-terminal">
                <div className="text-bloomberg-text-dim text-[9px] mb-1">VENUE BREAKDOWN</div>
                <div className="space-y-0.5 text-[10px]">
                  <div className="flex justify-between">
                    <span className="text-bloomberg-text-dim">Hyperliquid:</span>
                    <span className="text-bloomberg-text">85%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-bloomberg-text-dim">Lighter:</span>
                    <span className="text-bloomberg-text">10%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-bloomberg-text-dim">Decibel:</span>
                    <span className="text-bloomberg-text">5%</span>
                  </div>
                </div>
              </div>
              <div className="pt-2 border-t border-terminal">
                <div className="text-bloomberg-text-dim text-[9px] mb-0.5">EST. FEES</div>
                <div className="text-bloomberg-text-dim text-[10px]">
                  ${((accountSizeNum * stopLossNum / 100) * leverageNum * 0.0005 * 2).toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        </div>
        )}
      </div>
      ) : activeTab === 'backtest' ? (
        /* Backtest View - Full Simulation Component */
        <div className="h-[calc(100%-86px)] p-1">
          <Simulation strategy={strategy} embedded={true} />
        </div>
      ) : (
        /* Positions View - Active Position Management */
        <div className="h-[calc(100%-86px)] grid grid-cols-3 gap-1 p-1">
          {/* Mock Active Positions - In real app, this would come from API */}
          {[
            {
              id: 'pos-001',
              asset: 'ETH-PERP',
              direction: 'LONG',
              entryPrice: 3115.42,
              currentPrice: 3187.23,
              size: 5000,
              leverage: 3,
              unrealizedPnl: 1076.50,
              unrealizedPnlPercent: 2.3,
              entryTime: '2h 15m ago',
              exitConditions: [
                { type: 'polymarket', description: 'Polymarket: Ethereum ETF Approval probability ≥ 75%', status: 'PENDING' },
                { type: 'price', description: 'Price above $3500', status: 'PENDING' }
              ]
            },
            {
              id: 'pos-002',
              asset: 'BTC-PERP',
              direction: 'SHORT',
              entryPrice: 67250.00,
              currentPrice: 66890.00,
              size: 10000,
              leverage: 2,
              unrealizedPnl: 720.00,
              unrealizedPnlPercent: 1.07,
              entryTime: '5h 32m ago',
              exitConditions: [
                { type: 'polymarket', description: 'Polymarket: Bitcoin hits $100k probability ≥ 80%', status: 'PENDING' }
              ]
            }
          ].map((position) => (
            <div key={position.id} className="bg-bloomberg-panel border border-terminal flex flex-col">
              <div className="bg-bloomberg-bg border-b border-terminal px-2 py-1">
                <div className="flex items-center justify-between">
                  <div className="text-[#8B5CF6] text-xs font-bold uppercase">
                    {position.asset} {position.direction}
                  </div>
                  <div className={`text-[10px] font-bold ${
                    position.unrealizedPnl >= 0 ? 'text-bloomberg-green' : 'text-bloomberg-red'
                  }`}>
                    {position.unrealizedPnl >= 0 ? '+' : ''}{position.unrealizedPnlPercent.toFixed(2)}%
                  </div>
                </div>
              </div>
              <div className="flex-1 p-3 overflow-auto">
                <div className="space-y-2 text-xs font-mono">
                  {/* Position Details */}
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div>
                      <div className="text-bloomberg-text-dim text-[8px] mb-0.5">ENTRY PRICE</div>
                      <div className="text-bloomberg-text text-[10px] font-bold">${position.entryPrice.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-bloomberg-text-dim text-[8px] mb-0.5">CURRENT PRICE</div>
                      <div className="text-bloomberg-text text-[10px] font-bold">${position.currentPrice.toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div>
                      <div className="text-bloomberg-text-dim text-[8px] mb-0.5">SIZE</div>
                      <div className="text-bloomberg-text text-[10px]">${position.size.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-bloomberg-text-dim text-[8px] mb-0.5">LEVERAGE</div>
                      <div className="text-bloomberg-text text-[10px]">{position.leverage}x</div>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-terminal mb-2">
                    <div className="text-bloomberg-text-dim text-[8px] mb-0.5">UNREALIZED P&L</div>
                    <div className={`text-[11px] font-bold ${
                      position.unrealizedPnl >= 0 ? 'text-bloomberg-green' : 'text-bloomberg-red'
                    }`}>
                      {position.unrealizedPnl >= 0 ? '+' : ''}${position.unrealizedPnl.toFixed(2)}
                    </div>
                    <div className="text-bloomberg-text-dim text-[7px] mt-0.5">Opened {position.entryTime}</div>
                  </div>

                  {/* Exit Conditions */}
                  <div className="pt-2 border-t border-terminal">
                    <div className="text-bloomberg-text-dim text-[9px] mb-1">EXIT CONDITIONS</div>
                    <div className="space-y-1">
                      {position.exitConditions.map((exit, i) => {
                        // Mock progress for each exit condition
                        const progress = 65 + (i * 15) // Varies by condition
                        const isMet = exit.status === 'TRIGGERED'
                        const timeEstimate = progress > 80 ? '< 2h' : progress > 50 ? '2-4h' : '4-8h'
                        
                        return (
                          <div key={i} className="border border-terminal p-1.5 bg-bloomberg-bg">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[8px] text-bloomberg-text">
                                {exit.type === 'polymarket' ? '●' : '○'} {exit.description}
                              </span>
                              <span className={`text-[8px] font-bold ${
                                isMet ? 'text-bloomberg-green' : 'text-bloomberg-text-dim'
                              }`}>
                                {isMet ? 'TRIGGERED' : `${progress}%`}
                              </span>
                            </div>
                            {!isMet && (
                              <>
                                <div className="w-full h-0.5 bg-bloomberg-bg border border-terminal mb-1">
                                  <div 
                                    className="h-full bg-bloomberg-orange transition-all"
                                    style={{ width: `${progress}%` }}
                                  />
                                </div>
                                <div className="text-[7px] text-bloomberg-text-dim">
                                  Est. time: {timeEstimate}
                                </div>
                              </>
                            )}
                          </div>
                        )
                      })}
                    </div>
                    <div className="mt-2 pt-2 border-t border-terminal">
                      <div className="text-bloomberg-text-dim text-[8px] mb-1">QUICK ACTIONS</div>
                      <div className="grid grid-cols-2 gap-1">
                        <button className="px-2 py-1 bg-bloomberg-bg border border-terminal text-bloomberg-red hover:bg-bloomberg-panel text-[9px] font-mono uppercase">
                          CLOSE
                        </button>
                        <button className="px-2 py-1 bg-bloomberg-bg border border-terminal text-bloomberg-orange hover:bg-bloomberg-panel text-[9px] font-mono uppercase">
                          REVERSE
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {/* Add New Exit Condition Card */}
          <div className="bg-bloomberg-panel border-2 border-dashed border-terminal flex flex-col items-center justify-center p-4">
            <div className="text-bloomberg-text-dim text-xs text-center mb-2">
              <div className="text-[#8B5CF6] font-bold mb-1">MANAGE POSITIONS</div>
              <div className="text-[10px]">Create exit conditions from terminal</div>
            </div>
            <div className="text-bloomberg-text-dim text-[9px] text-center space-y-1">
              <div>"Close position if Polymarket..."</div>
              <div>"Reverse position when..."</div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Action Bar */}
      <div className="bg-bloomberg-panel border-t border-terminal h-6 flex items-center justify-between px-2">
        <div className="flex items-center gap-4 text-xs text-bloomberg-text-dim">
          <span>F1: New Strategy</span>
          <span>F2: Execute</span>
          <span>F3: {activeTab === 'monitoring' ? 'Backtest' : activeTab === 'backtest' ? 'Positions' : 'Monitoring'}</span>
          <span>F4: Export</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onReset}
            className="px-3 py-0.5 bg-bloomberg-panel border border-terminal text-bloomberg-text-dim hover:text-bloomberg-text hover:border-bloomberg-orange text-xs font-mono uppercase transition-colors"
          >
            [RESET]
          </button>
          <a
            href="#"
            className="px-4 py-0.5 bg-bloomberg-orange text-bloomberg-bg hover:bg-bloomberg-orange-bright text-xs font-mono uppercase font-bold transition-colors"
          >
            GET ACCESS
          </a>
        </div>
      </div>
    </div>
  )
}

