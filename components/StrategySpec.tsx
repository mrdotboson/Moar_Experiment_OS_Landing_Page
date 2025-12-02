'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { ParsedStrategy } from '@/lib/strategyParser'
import { getUIAdaptations } from '@/lib/strategyType'

interface StrategySpecProps {
  strategy: ParsedStrategy
  onStrategyUpdate?: (updated: ParsedStrategy) => void
  autoAdvance?: boolean
}

export default function StrategySpec({ strategy, onStrategyUpdate, autoAdvance = true }: StrategySpecProps) {
  if (!strategy) {
    return null
  }

  // Check if this is position management
  const isPositionManagement = strategy.isPositionManagement || false
  const positionAction = strategy.positionAction

  // Get UI adaptations based on strategy type
  const uiAdaptations = getUIAdaptations(strategy)
  const hasPolymarket = uiAdaptations.typeInfo.hasPolymarket

  // Local editable state (as strings for better input handling)
  const [stopLoss, setStopLoss] = useState(String(strategy.stopLoss))
  const [takeProfit, setTakeProfit] = useState(String(strategy.takeProfit))
  const [leverage, setLeverage] = useState(String(strategy.leverage || 2))
  const [accountSize, setAccountSize] = useState('250000')
  
  // Track updates to show "TRIGGERED" after a few iterations
  const [showTriggered, setShowTriggered] = useState(false)
  const updateCountRef = useRef(0)
  
  // Show "TRIGGERED" after 3 updates (when auto-advance is off)
  useEffect(() => {
    if (!autoAdvance && !showTriggered) {
      updateCountRef.current = 0
      const interval = setInterval(() => {
        updateCountRef.current++
        if (updateCountRef.current >= 3) {
          setShowTriggered(true)
          clearInterval(interval)
        }
      }, 2000) // Check every 2 seconds
      
      return () => clearInterval(interval)
    }
  }, [autoAdvance, showTriggered])

  // Generate stable condition data - use deterministic values when auto-advance is off
  const conditionDataCache = useMemo(() => {
    const cache: Record<number, any> = {}
    strategy.conditions.forEach((cond, i) => {
      // Use deterministic seed based on condition index when auto-advance is off
      // This creates stable, readable values that don't change on re-render
      const seed = autoAdvance ? Math.random() : (0.3 + (i * 0.15)) % 1 // Deterministic but varied
      
      if (cond.eventType === 'polymarket') {
        const threshold = typeof cond.probability === 'number' ? cond.probability : 75
        // When triggered, show current value at or above threshold
        let current = showTriggered 
          ? threshold + (Math.random() * 2) // Show as met (slightly above threshold)
          : (() => {
              let base = 68.5
              if (threshold >= 80) {
                base = 60 + seed * 15
              } else if (threshold >= 70) {
                base = 65 + seed * 10
              } else {
                base = 55 + seed * 10
              }
              return base
            })()
        cache[i] = {
          current: Math.round(current * 10) / 10,
          threshold: threshold,
          unit: '%',
          trend: '+2.3%',
          velocity: '+0.8%/h',
          distance: showTriggered ? '0' : (threshold - current).toFixed(1),
          direction: '↑',
          momentum: 'ACCELERATING'
        }
      } else if (cond.type === 'oi') {
        const isAbsolute = (cond as any).isAbsolute
        if (isAbsolute) {
          const threshold = typeof cond.value === 'number' ? cond.value : 2000000000
          const current = threshold * (0.85 + seed * 0.1)
          cache[i] = {
            current: Math.round(current / 1000000) / 1000,
            threshold: threshold / 1000000000,
            unit: 'B',
            trend: '+$0.1B',
            velocity: '+$0.05B/h',
            distance: ((threshold - current) / 1000000000).toFixed(2),
            direction: '↑',
            momentum: 'ACCELERATING'
          }
        } else {
          const threshold = typeof cond.value === 'number' ? cond.value : 5
          const timePeriod = (cond as any).timePeriod || '1h'
          const current = 2.5 + seed * 1.5
          cache[i] = {
            current: Math.round(current * 10) / 10,
            threshold: threshold,
            unit: '%',
            trend: `+${(0.5 + seed * 0.5).toFixed(1)}%`,
            velocity: `+${(0.2 + seed * 0.2).toFixed(1)}%/${timePeriod}`,
            distance: (threshold - current).toFixed(1),
            direction: '↑',
            momentum: 'ACCELERATING',
            timePeriod: timePeriod
          }
        }
      } else if (cond.type === 'price') {
        const threshold = typeof cond.value === 'number' ? cond.value : 3200
        const current = threshold * (0.95 + seed * 0.05)
        cache[i] = {
          current: Math.round(current * 100) / 100,
          threshold: threshold,
          unit: '$',
          trend: '+2.4%',
          velocity: '+0.1%/h',
          distance: (threshold - current).toFixed(2),
          direction: '↑',
          momentum: 'STABLE'
        }
      }
    })
    return cache
  }, [strategy, autoAdvance, showTriggered])

  // Update local state when strategy prop changes
  useEffect(() => {
    setStopLoss(String(strategy.stopLoss))
    setTakeProfit(String(strategy.takeProfit))
    setLeverage(String(strategy.leverage || 2))
  }, [strategy])

  // Update parent when values change (debounced to avoid too many updates)
  useEffect(() => {
    if (!onStrategyUpdate) return
    
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
  }, [stopLoss, takeProfit, leverage, onStrategyUpdate, strategy])

  // Trader-focused calculations (convert strings to numbers)
  const stopLossNum = parseFloat(stopLoss) || strategy.stopLoss || 2
  const takeProfitNum = parseFloat(takeProfit) || strategy.takeProfit || 4
  const leverageNum = parseInt(leverage) || strategy.leverage || 2
  const accountSizeNum = parseFloat(accountSize) || 250000
  
  // Use stopLoss as base position size (no automatic dynamic sizing)
  const positionSizePercent = stopLossNum
  
  const winRate = 0.75 // More realistic win rate
  const lossRate = 1 - winRate
  const expectedValue = (winRate * takeProfitNum) - (lossRate * stopLossNum)
  const riskReward = takeProfitNum / stopLossNum
  const positionSize = accountSizeNum * (positionSizePercent / 100) // Risk-based or dynamic position sizing
  const capitalAtRisk = positionSize * leverageNum * (stopLossNum / 100)
  const maxProfit = positionSize * leverageNum * (takeProfitNum / 100)
  const fees = 0.0005 // 0.05% maker/taker fees
  const feesImpact = (positionSize * leverageNum * fees * 2) // Entry + exit
  const netProfit = maxProfit - feesImpact
  const roiOnRisk = capitalAtRisk > 0 ? (netProfit / capitalAtRisk) * 100 : 0

  return (
    <div className="absolute inset-0 bg-bloomberg-bg z-20">
      {/* Triggered Banner - Prominent Notification */}
      {showTriggered && (
        <div className="bg-bloomberg-green/20 border-b-2 border-bloomberg-green px-4 py-2 animate-pulse">
          <div className="flex items-center justify-center gap-3">
            <span className="text-bloomberg-green font-bold text-sm">● CONDITION TRIGGERED</span>
            <span className="text-bloomberg-text-dim">|</span>
            <span className="text-bloomberg-green text-xs font-bold">Press → or SPACE to continue to terminal</span>
          </div>
        </div>
      )}

      {/* Top Status Bar */}
      <div className={`bg-bloomberg-panel border-b border-terminal h-6 flex items-center justify-between px-2 text-xs ${showTriggered ? 'border-bloomberg-green/50' : ''}`}>
        <div className="flex items-center gap-4">
          <span className="text-[#8B5CF6] font-bold">DEPLOY</span>
          <span className="text-bloomberg-text-dim">COMPILED STRATEGY</span>
          {showTriggered ? (
            <span className="text-bloomberg-green text-[9px] font-bold">● TRIGGERED</span>
          ) : (
            <span className="text-bloomberg-green text-[9px]">● READY</span>
          )}
        </div>
        <div className="text-bloomberg-text-dim">
          {strategy.asset} | {strategy.action} | {leverageNum}x
        </div>
      </div>

      {/* Main Content - Optimized Layout */}
      <div className={showTriggered ? "h-[calc(100%-54px)] grid grid-cols-3 gap-1 p-1" : "h-[calc(100%-24px)] grid grid-cols-3 gap-1 p-1"}>
        {/* Left Panel - Entry Logic */}
          <div className="bg-bloomberg-panel border border-terminal flex flex-col">
          <div className="bg-bloomberg-bg border-b border-terminal px-2 py-1">
            <div className="text-[#8B5CF6] text-xs font-bold uppercase">
              {isPositionManagement 
                ? `${positionAction === 'CLOSE' ? 'CLOSE' : positionAction === 'REVERSE' ? 'REVERSE' : 'CANCEL'} POSITION CONDITION`
                : hasPolymarket ? 'EVENT-AWARE CONDITIONAL ORDER' : 'CONDITIONAL ORDER'
              }
            </div>
          </div>
          <div className="flex-1 p-3 overflow-auto">
            <div className="space-y-3 text-xs font-mono">
              {/* Natural Language Display */}
              <div className="pb-2 border-b border-terminal">
                <div className="text-bloomberg-text-dim text-[9px] mb-1">NATURAL LANGUAGE</div>
                <div className="text-bloomberg-text text-[10px] leading-relaxed italic">
                  "{strategy.naturalLanguage || 'Strategy description'}"
                </div>
              </div>
              
              {/* Multi-Event Logic Indicator */}
              {strategy.eventLogic && strategy.conditions.filter(c => c.eventType === 'polymarket').length > 1 && (
                <div className="pb-2 border-b border-terminal">
                  <div className="text-bloomberg-text-dim text-[9px] mb-1">EVENT LOGIC</div>
                  <div className={`text-[10px] font-bold ${
                    strategy.eventLogic === 'AND' ? 'text-bloomberg-orange' : 'text-[#8B5CF6]'
                  }`}>
                    {strategy.eventLogic === 'AND' ? '● ALL EVENTS' : '● ANY EVENT'} must trigger
                  </div>
                  <div className="text-bloomberg-text-dim text-[8px] mt-0.5">
                    {strategy.conditions.filter(c => c.eventType === 'polymarket').length} Polymarket events
                  </div>
                </div>
              )}
              
              {/* Conditions - Detailed Breakdown */}
              <div>
                <div className="text-bloomberg-text-dim text-[9px] mb-1">TRIGGER CONDITIONS</div>
                <div className="space-y-2">
                  {strategy.conditions.map((cond, i) => {
                    // Use cached stable data (deterministic when auto-advance is off)
                    const data = conditionDataCache[i] || {
                      current: 0,
                      threshold: 0,
                      unit: '',
                      trend: '',
                      velocity: '',
                      distance: '0',
                      direction: '↑',
                      momentum: 'STABLE'
                    }
                    // Show as triggered after 3 updates (for demo purposes)
                    const isActuallyMet = cond.type === 'price' 
                      ? (cond.description.includes('above') ? data.current >= data.threshold : data.current <= data.threshold)
                      : data.current >= data.threshold
                    const isMet = showTriggered || isActuallyMet
                    const distanceToTrigger = cond.type === 'price'
                      ? Math.abs(data.threshold - data.current).toFixed(2)
                      : (data.threshold - data.current).toFixed(1)
                    
                    // Calculate progress
                    let progress = 0
                    if (isMet) {
                      progress = 100
                    } else if (cond.eventType === 'polymarket') {
                      const baseline = 50
                      progress = Math.max(0, Math.min(100, ((data.current - baseline) / (data.threshold - baseline)) * 100))
                    } else if (cond.type === 'oi') {
                      const baseline = 0
                      progress = Math.max(0, Math.min(100, ((data.current - baseline) / (data.threshold - baseline)) * 100))
                    } else if (cond.type === 'price') {
                      const baseline = cond.description.includes('above') 
                        ? data.threshold * 0.9 
                        : data.threshold * 1.1
                      const range = Math.abs(data.threshold - baseline)
                      progress = Math.max(0, Math.min(100, (Math.abs(data.current - baseline) / range) * 100))
                    }

                    return (
                      <div key={i} className="border border-terminal p-2 bg-bloomberg-bg">
                        {/* Condition Header */}
                        <div className="flex items-center justify-between mb-2">
                          <div className={`flex items-center gap-1.5 ${cond.eventType === 'polymarket' ? 'text-[#8B5CF6]' : 'text-bloomberg-green'}`}>
                            <span className="text-[8px]">●</span>
                            <span className="text-[10px] font-bold">{cond.description}</span>
                          </div>
                          <span className={`text-[9px] font-bold ${isMet ? 'text-bloomberg-green' : 'text-bloomberg-text-dim'}`}>
                            {isMet ? '● MET' : '○ PENDING'}
                          </span>
                        </div>

                        {/* Polymarket Event-Specific: Market Info & Sentiment */}
                        {cond.eventType === 'polymarket' && (
                          <div className="mb-2 p-1.5 bg-bloomberg-panel border border-terminal">
                            <div className="grid grid-cols-2 gap-2 mb-1.5 text-[8px]">
                              <div>
                                <div className="text-bloomberg-text-dim">Market ID:</div>
                                <div className="text-bloomberg-text text-[9px] font-mono">
                                  {cond.marketId || 'market-001'}
                                </div>
                              </div>
                              <div>
                                <div className="text-bloomberg-text-dim">Resolution:</div>
                                <div className="text-bloomberg-text text-[9px]">Dec 31, 2024</div>
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-1 mb-1.5 text-[8px]">
                              <div>
                                <div className="text-bloomberg-text-dim">Volume (24h):</div>
                                <div className="text-bloomberg-text text-[9px]">$1.2M</div>
                              </div>
                              <div>
                                <div className="text-bloomberg-text-dim">Liquidity:</div>
                                <div className="text-bloomberg-green text-[9px]">$847K</div>
                                <div className="text-bloomberg-text-dim text-[7px]">Available</div>
                              </div>
                              <div>
                                <div className="text-bloomberg-text-dim">Prob Change:</div>
                                <div className="text-bloomberg-green text-[9px]">+12.4%</div>
                                <div className="text-bloomberg-text-dim text-[7px]">7d change</div>
                              </div>
                            </div>
                            
                            {/* Probability Chart (Mini) */}
                            <div className="mb-1">
                              <div className="text-bloomberg-text-dim text-[7px] mb-0.5">Probability Trend (7d)</div>
                              <div className="h-8 bg-bloomberg-bg border border-terminal relative overflow-hidden">
                                {/* Simulated probability line chart */}
                                <svg className="w-full h-full" viewBox="0 0 100 30" preserveAspectRatio="none">
                                  <polyline
                                    points="0,25 10,22 20,20 30,18 40,16 50,15 60,14 70,13 80,12 90,11 100,10"
                                    fill="none"
                                    stroke="#8B5CF6"
                                    strokeWidth="1.5"
                                    vectorEffect="non-scaling-stroke"
                                  />
                                  {/* Target threshold line */}
                                  <line
                                    x1="0"
                                    y1={30 - (data.threshold / 100) * 30}
                                    x2="100"
                                    y2={30 - (data.threshold / 100) * 30}
                                    stroke="#FF6600"
                                    strokeWidth="0.5"
                                    strokeDasharray="2,2"
                                    vectorEffect="non-scaling-stroke"
                                  />
                                  {/* Current probability marker */}
                                  <circle
                                    cx="100"
                                    cy={30 - (data.current / 100) * 30}
                                    r="1.5"
                                    fill="#8B5CF6"
                                    vectorEffect="non-scaling-stroke"
                                  />
                                </svg>
                              </div>
                              <div className="flex justify-between text-[7px] text-bloomberg-text-dim mt-0.5">
                                <span>7d ago: 56%</span>
                                <span>Now: {data.current}%</span>
                                <span>Target: {data.threshold}%</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Current vs Threshold */}
                        <div className="grid grid-cols-2 gap-2 mb-2 text-[9px]">
                          <div>
                            <div className="text-bloomberg-text-dim text-[8px] mb-0.5">CURRENT</div>
                            <div className="text-bloomberg-text text-[10px] font-bold">
                              {cond.type === 'oi' && (cond as any).isAbsolute 
                                ? `$${data.current.toFixed(2)}${data.unit}`
                                : `${data.current.toLocaleString()}${data.unit}`
                              }
                            </div>
                            {cond.type === 'oi' && !(cond as any).isAbsolute && (cond as any).timePeriod && (
                              <div className="text-bloomberg-text-dim text-[7px] mt-0.5">
                                Change over {(cond as any).timePeriod}
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="text-bloomberg-text-dim text-[8px] mb-0.5">THRESHOLD</div>
                            <div className="text-bloomberg-text text-[10px] font-bold">
                              {cond.type === 'oi' && (cond as any).isAbsolute
                                ? `$${data.threshold.toFixed(2)}${data.unit}`
                                : `${data.threshold.toLocaleString()}${data.unit}`
                              }
                            </div>
                            {cond.type === 'oi' && !(cond as any).isAbsolute && (cond as any).timePeriod && (
                              <div className="text-bloomberg-text-dim text-[7px] mt-0.5">
                                Target over {(cond as any).timePeriod}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mb-2">
                          <div className="flex items-center justify-between text-[8px] text-bloomberg-text-dim mb-0.5">
                            <span>{isMet ? 'Triggered' : 'Progress to threshold'}</span>
                            <span>{isMet ? '100%' : `${progress.toFixed(0)}%`}</span>
                          </div>
                          <div className="w-full h-1 bg-bloomberg-bg border border-terminal">
                            <div 
                              className={`h-full ${isMet ? 'bg-bloomberg-green' : 'bg-bloomberg-orange'}`}
                              style={{ width: `${Math.min(100, progress)}%` }}
                            />
                          </div>
                          {!isMet && (
                            <div className="text-[7px] text-bloomberg-text-dim mt-0.5">
                              {cond.type === 'price' 
                                ? `Need ${distanceToTrigger}${data.unit} ${cond.description.includes('above') ? 'more' : 'less'} to trigger`
                                : `Need ${distanceToTrigger}${data.unit} more to trigger`
                              }
                            </div>
                          )}
                        </div>

                        {/* Distance & Velocity - Most Critical */}
                        <div className="grid grid-cols-2 gap-2 mb-2 text-[8px]">
                          <div>
                            <div className="text-bloomberg-text-dim">Distance:</div>
                            <div className={`text-[9px] font-bold ${isMet ? 'text-bloomberg-green' : 'text-bloomberg-text'}`}>
                              {isMet ? 'TRIGGERED' : `${distanceToTrigger}${data.unit} away`}
                            </div>
                          </div>
                          <div>
                            <div className="text-bloomberg-text-dim">Velocity:</div>
                            <div className={`text-[9px] font-bold ${data.direction === '↑' ? 'text-bloomberg-green' : 'text-bloomberg-red'}`}>
                              {data.velocity} {data.direction}
                            </div>
                          </div>
                        </div>

                        {/* Estimated Time to Trigger - Most Actionable */}
                        {!isMet && (
                          <div className="mb-2 text-[8px] border-t border-terminal pt-1">
                            <div className="text-bloomberg-text-dim">Est. Time to Trigger:</div>
                            <div className="text-bloomberg-text text-[9px] font-bold">
                              {(() => {
                                const velocityNum = parseFloat(data.velocity.replace(/[^0-9.-]/g, ''))
                                if (velocityNum > 0) {
                                  const hours = parseFloat(distanceToTrigger) / Math.abs(velocityNum)
                                  if (hours < 1) return `${Math.round(hours * 60)}m`
                                  if (hours < 24) return `${hours.toFixed(1)}h`
                                  return `${(hours / 24).toFixed(1)}d`
                                }
                                return 'N/A'
                              })()}
                            </div>
                          </div>
                        )}

                        {/* Trend Context - Quick Glance */}
                        <div className="grid grid-cols-2 gap-2 text-[8px] border-t border-terminal pt-1">
                          <div>
                            <div className="text-bloomberg-text-dim">Trend (24h):</div>
                            <div className={`text-[9px] ${data.direction === '↑' ? 'text-bloomberg-green' : 'text-bloomberg-red'}`}>
                              {data.trend} {data.direction}
                            </div>
                          </div>
                          <div>
                            <div className="text-bloomberg-text-dim">Momentum:</div>
                            <div className={`text-[9px] font-bold ${
                              data.momentum === 'ACCELERATING' ? 'text-bloomberg-green' :
                              data.momentum === 'DECELERATING' ? 'text-bloomberg-red' :
                              'text-bloomberg-text'
                            }`}>
                              {data.momentum === 'ACCELERATING' ? '↑↑' : data.momentum === 'DECELERATING' ? '↓↓' : '→'}
                            </div>
                          </div>
                        </div>

                        {/* Event-Specific: Time to Resolution (for Polymarket) */}
                        {cond.eventType === 'polymarket' && (
                          <div className="mt-1 pt-1 border-t border-terminal text-[8px]">
                            <div className="text-bloomberg-text-dim">Time to Resolution:</div>
                            <div className="text-bloomberg-text text-[9px] font-bold">12d 4h 32m</div>
                            <div className="text-bloomberg-text-dim text-[7px] mt-0.5">
                              Event resolves: Dec 31, 2024 23:59 UTC
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
              
              {!isPositionManagement && (
                <div className="pt-2 border-t border-terminal">
                  <div className="text-bloomberg-text-dim text-[9px] mb-1">ACTION</div>
                  <div className="text-bloomberg-green text-[10px]">
                    {strategy.action} {strategy.asset} @ {leverageNum}x
                  </div>
                </div>
              )}
              {isPositionManagement && (
                <div className="pt-2 border-t border-terminal">
                  <div className="text-bloomberg-text-dim text-[9px] mb-1">POSITION ACTION</div>
                  <div className={`text-[10px] font-bold ${
                    positionAction === 'CLOSE' ? 'text-bloomberg-red' :
                    positionAction === 'REVERSE' ? 'text-bloomberg-orange' :
                    'text-bloomberg-text-dim'
                  }`}>
                    {positionAction === 'CLOSE' 
                      ? (strategy.positionSize && strategy.positionSize < 100 
                          ? `● CLOSE ${strategy.positionSize}% OF POSITION`
                          : '● CLOSE POSITION')
                      : positionAction === 'REVERSE' 
                        ? '● REVERSE POSITION'
                        : '● CANCEL POSITION'}
                  </div>
                  <div className="text-bloomberg-text-dim text-[8px] mt-0.5">
                    {strategy.exitLogic === 'ANY' 
                      ? 'When ANY exit condition is met'
                      : 'When ALL exit conditions are met'}
                  </div>
                  {/* Show Polymarket-specific exit parameters if present */}
                  {(strategy.probabilityMomentum || strategy.resolutionDeadline || strategy.liquidityThreshold || 
                    strategy.probabilityChangeRate || strategy.probabilityRangeMin || strategy.probabilityRangeMax) && (
                    <div className="mt-2 pt-2 border-t border-terminal space-y-1 text-[8px]">
                      {strategy.probabilityMomentum && (
                        <div className="text-bloomberg-text-dim">
                          Prob Momentum: {strategy.probabilityMomentumDirection === 'DROP' ? 'Drops' : 
                                         strategy.probabilityMomentumDirection === 'ACCELERATE' ? 'Accelerates' : 
                                         'Reverses'} {strategy.probabilityMomentum}%
                        </div>
                      )}
                      {strategy.resolutionDeadline && (
                        <div className="text-bloomberg-text-dim">
                          Resolution: {strategy.resolutionDeadlineCondition === 'BEFORE_THRESHOLD' 
                            ? 'Before threshold reached'
                            : `${strategy.resolutionDeadline}h remaining`}
                        </div>
                      )}
                      {strategy.liquidityThreshold && (
                        <div className="text-bloomberg-text-dim">
                          Liquidity: ${(strategy.liquidityThreshold / 1000).toFixed(0)}K threshold
                        </div>
                      )}
                      {strategy.probabilityChangeRate && (
                        <div className="text-bloomberg-text-dim">
                          Change Rate: {strategy.probabilityChangeRateDirection === 'SLOW' ? 'Slows to' : 'Exceeds'} {strategy.probabilityChangeRate}%/h
                        </div>
                      )}
                      {(strategy.probabilityRangeMin || strategy.probabilityRangeMax) && (
                        <div className="text-bloomberg-text-dim">
                          Prob Range: {strategy.probabilityRangeMin || '0'}% - {strategy.probabilityRangeMax || '100'}%
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Center Panel - Risk & Position Sizing (or Exit Condition Summary for position management) */}
        <div className="bg-bloomberg-panel border border-terminal flex flex-col">
          <div className="bg-bloomberg-bg border-b border-terminal px-2 py-1">
            <div className="text-[#8B5CF6] text-xs font-bold uppercase">
              {isPositionManagement ? 'EXIT CONDITION SUMMARY' : 'RISK & POSITION'}
            </div>
          </div>
          <div className="flex-1 p-3 overflow-auto">
            <div className="space-y-3 text-xs font-mono">
              {isPositionManagement ? (
                /* Exit Condition Summary for Position Management */
                <>
                  <div>
                    <div className="text-bloomberg-text-dim text-[9px] mb-1">EXIT TRIGGER</div>
                    <div className={`text-[11px] font-bold ${
                      positionAction === 'CLOSE' ? 'text-bloomberg-red' :
                      positionAction === 'REVERSE' ? 'text-bloomberg-orange' :
                      'text-bloomberg-text-dim'
                    }`}>
                      {positionAction === 'CLOSE' ? 'Position will be closed' :
                       positionAction === 'REVERSE' ? 'Position will be reversed' :
                       'Position will be cancelled'}
                    </div>
                    <div className="text-bloomberg-text-dim text-[8px] mt-0.5">
                      {strategy.exitLogic === 'ANY' 
                        ? 'When ANY exit condition is met'
                        : 'When ALL exit conditions are met'}
                    </div>
                  </div>
                  <div className="pt-2 border-t border-terminal">
                    <div className="text-bloomberg-text-dim text-[9px] mb-1">EXIT CONDITIONS</div>
                    <div className="space-y-1">
                      {strategy.conditions.map((cond, i) => (
                        <div key={i} className="border border-terminal p-1.5 bg-bloomberg-bg">
                          <div className="text-[9px] text-bloomberg-text">
                            {cond.eventType === 'polymarket' ? '●' : '○'} {cond.description}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Visual Flow Diagram for Position Automation */}
                  {strategy.conditions.length > 0 && (
                    <div className="pt-3 border-t border-terminal">
                      <div className="text-bloomberg-text-dim text-[9px] mb-2">AUTOMATION FLOW</div>
                      <div className="bg-bloomberg-bg border border-terminal p-2 space-y-2">
                        {/* Start */}
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-bloomberg-green rounded-full"></div>
                          <div className="text-bloomberg-text-dim text-[8px]">Position Active</div>
                        </div>
                        
                        {/* Arrow */}
                        <div className="flex items-center gap-2 pl-1">
                          <div className="w-0.5 h-3 bg-bloomberg-text-dim"></div>
                        </div>
                        
                        {/* Conditions */}
                        {strategy.conditions.map((cond, i) => (
                          <div key={i} className="space-y-1">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${
                                cond.eventType === 'polymarket' ? 'bg-[#8B5CF6]' :
                                cond.type === 'pnl' ? 'bg-bloomberg-green' :
                                cond.type === 'time' ? 'bg-bloomberg-orange' :
                                cond.type === 'trailing_stop' ? 'bg-bloomberg-red' :
                                'bg-bloomberg-text-dim'
                              }`}></div>
                              <div className="text-bloomberg-text text-[8px] flex-1">
                                {cond.description}
                              </div>
                            </div>
                            {i < strategy.conditions.length - 1 && (
                              <div className="flex items-center gap-2 pl-1">
                                <div className={`w-0.5 h-3 ${
                                  strategy.exitLogic === 'ANY' ? 'bg-bloomberg-orange' : 'bg-bloomberg-text-dim'
                                }`}></div>
                                <div className="text-bloomberg-text-dim text-[7px]">
                                  {strategy.exitLogic === 'ANY' ? 'OR' : 'AND'}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                        
                        {/* Arrow */}
                        <div className="flex items-center gap-2 pl-1">
                          <div className="w-0.5 h-3 bg-bloomberg-text-dim"></div>
                        </div>
                        
                        {/* Action */}
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            positionAction === 'CLOSE' ? 'bg-bloomberg-red' :
                            positionAction === 'REVERSE' ? 'bg-bloomberg-orange' :
                            'bg-bloomberg-text-dim'
                          }`}></div>
                          <div className={`text-[9px] font-bold ${
                            positionAction === 'CLOSE' ? 'text-bloomberg-red' :
                            positionAction === 'REVERSE' ? 'text-bloomberg-orange' :
                            'text-bloomberg-text-dim'
                          }`}>
                            {positionAction === 'CLOSE' ? 'Close Position' :
                             positionAction === 'REVERSE' ? 'Reverse Position' :
                             'Cancel Position'}
                            {strategy.positionSize && strategy.positionSize < 100 && (
                              <span className="text-bloomberg-text-dim"> ({strategy.positionSize}%)</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
              {/* Risk Parameters - Editable */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-bloomberg-text-dim text-[9px] mb-0.5">STOP LOSS</div>
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={stopLoss}
                      onChange={(e) => {
                        const val = e.target.value
                        // Allow empty, numbers, and one decimal point
                        if (val === '' || /^\d*\.?\d*$/.test(val)) {
                          setStopLoss(val)
                        }
                      }}
                      onBlur={(e) => {
                        const val = parseFloat(e.target.value)
                        if (isNaN(val) || val < 0.1) {
                          setStopLoss(String(strategy.stopLoss))
                        } else if (val > 50) {
                          setStopLoss('50')
                        } else {
                          setStopLoss(String(val))
                        }
                      }}
                      className="w-full bg-bloomberg-bg border border-terminal text-bloomberg-red text-[11px] font-bold px-1 py-0.5 focus:outline-none focus:border-[#8B5CF6]"
                    />
                    <span className="text-bloomberg-red text-[10px]">%</span>
                  </div>
                </div>
                <div>
                  <div className="text-bloomberg-text-dim text-[9px] mb-0.5">TAKE PROFIT</div>
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={takeProfit}
                      onChange={(e) => {
                        const val = e.target.value
                        // Allow empty, numbers, and one decimal point
                        if (val === '' || /^\d*\.?\d*$/.test(val)) {
                          setTakeProfit(val)
                        }
                      }}
                      onBlur={(e) => {
                        const val = parseFloat(e.target.value)
                        if (isNaN(val) || val < 0.1) {
                          setTakeProfit(String(strategy.takeProfit))
                        } else if (val > 100) {
                          setTakeProfit('100')
                        } else {
                          setTakeProfit(String(val))
                        }
                      }}
                      className="w-full bg-bloomberg-bg border border-terminal text-bloomberg-green text-[11px] font-bold px-1 py-0.5 focus:outline-none focus:border-[#8B5CF6]"
                    />
                    <span className="text-bloomberg-green text-[10px]">%</span>
                  </div>
                </div>
              </div>

              {/* Risk/Reward */}
              <div className="pt-2 border-t border-terminal">
                <div className="text-bloomberg-text-dim text-[9px] mb-0.5">RISK/REWARD</div>
                <div className="text-bloomberg-text text-[11px] font-bold">1:{riskReward.toFixed(2)}</div>
              </div>

              {/* Position Adjustments - Dynamic Sizing */}
              {strategy.positionAdjustments && strategy.positionAdjustments.length > 0 && (
                <div className="pt-2 border-t border-terminal mb-2">
                  <div className="text-bloomberg-text-dim text-[9px] mb-1">POSITION ADJUSTMENTS</div>
                  <div className="text-[#8B5CF6] text-[10px] font-bold mb-1">● ENABLED</div>
                  <div className="space-y-1.5">
                    {strategy.positionAdjustments.map((adj, i) => (
                      <div key={i} className="border border-terminal p-1.5 bg-bloomberg-bg">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[8px] text-bloomberg-text">
                            {adj.direction === 'INCREASE' ? '↑' : '↓'} {adj.direction}
                          </span>
                          <span className={`text-[9px] font-bold ${
                            adj.direction === 'INCREASE' ? 'text-bloomberg-green' : 'text-bloomberg-red'
                          }`}>
                            {adj.direction === 'INCREASE' ? '+' : ''}{Math.abs(adj.adjustment)}%
                          </span>
                        </div>
                        <div className="text-[7px] text-bloomberg-text-dim">
                          When probability {adj.direction === 'INCREASE' ? 'reaches' : 'drops to'} {adj.probability}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Position Sizing - Editable Account Size */}
              <div className="pt-2 border-t border-terminal">
                <div className="text-bloomberg-text-dim text-[9px] mb-1">POSITION SIZE</div>
                <div className="mb-1.5">
                  <div className="flex items-center gap-1 mb-1">
                    <span className="text-bloomberg-text-dim text-[9px]">Account:</span>
                    <input
                      type="text"
                      value={accountSize}
                      onChange={(e) => {
                        const val = e.target.value
                        // Allow empty or numbers only
                        if (val === '' || /^\d*$/.test(val)) {
                          setAccountSize(val)
                        }
                      }}
                      onBlur={(e) => {
                        const val = parseFloat(e.target.value)
                        if (isNaN(val) || val < 1000) {
                          setAccountSize('250000')
                        } else if (val > 10000000) {
                          setAccountSize('10000000')
                        } else {
                          setAccountSize(String(Math.floor(val)))
                        }
                      }}
                      className="flex-1 bg-bloomberg-bg border border-terminal text-bloomberg-text text-[10px] px-1 py-0.5 focus:outline-none focus:border-[#8B5CF6]"
                    />
                  </div>
                </div>
                <div className="space-y-1 text-[10px]">
                  <div className="flex justify-between">
                    <span className="text-bloomberg-text-dim">Size:</span>
                    <span className="text-bloomberg-text">${positionSize.toFixed(0)}</span>
                    {strategy.positionAdjustments && strategy.positionAdjustments.length > 0 && (
                      <span className="text-[#8B5CF6] text-[8px]">(adjustable)</span>
                    )}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-bloomberg-text-dim">Capital at Risk:</span>
                    <span className="text-bloomberg-red">${capitalAtRisk.toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-bloomberg-text-dim">Max Profit:</span>
                    <span className="text-bloomberg-green">${maxProfit.toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-bloomberg-text-dim">Fees:</span>
                    <span className="text-bloomberg-text-dim">${feesImpact.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Expected Value */}
              {/* Leverage - Editable */}
              <div className="pt-2 border-t border-terminal">
                <div className="text-bloomberg-text-dim text-[9px] mb-0.5">LEVERAGE</div>
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={leverage}
                    onChange={(e) => {
                      const val = e.target.value
                      // Allow empty or numbers only
                      if (val === '' || /^\d*$/.test(val)) {
                        setLeverage(val)
                      }
                    }}
                    onBlur={(e) => {
                      const val = parseInt(e.target.value)
                      if (isNaN(val) || val < 1) {
                        setLeverage(String(strategy.leverage || 2))
                      } else if (val > 100) {
                        setLeverage('100')
                      } else {
                        setLeverage(String(val))
                      }
                    }}
                    className="w-full bg-bloomberg-bg border border-terminal text-bloomberg-text text-[11px] font-bold px-1 py-0.5 focus:outline-none focus:border-[#8B5CF6]"
                  />
                  <span className="text-bloomberg-text text-[10px]">x</span>
                </div>
              </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel - Strategy Summary & Calculations (or Exit Action Summary for position management) */}
        <div className="bg-bloomberg-panel border border-terminal flex flex-col">
          <div className="bg-bloomberg-bg border-b border-terminal px-2 py-1">
            <div className="text-[#8B5CF6] text-xs font-bold uppercase">
              {isPositionManagement ? 'EXIT ACTION SUMMARY' : 'STRATEGY SUMMARY'}
            </div>
          </div>
          <div className="flex-1 p-3 overflow-auto">
            <div className="space-y-3 text-xs font-mono">
              {isPositionManagement ? (
                /* Exit Action Summary */
                <>
                  <div>
                    <div className="text-bloomberg-text-dim text-[9px] mb-0.5">ACTION TYPE</div>
                    <div className={`text-[11px] font-bold ${
                      positionAction === 'CLOSE' ? 'text-bloomberg-red' :
                      positionAction === 'REVERSE' ? 'text-bloomberg-orange' :
                      'text-bloomberg-text-dim'
                    }`}>
                      {positionAction === 'CLOSE' ? 'CLOSE POSITION' :
                       positionAction === 'REVERSE' ? 'REVERSE POSITION' :
                       'CANCEL POSITION'}
                    </div>
                  </div>
                  <div className="pt-2 border-t border-terminal">
                    <div className="text-bloomberg-text-dim text-[9px] mb-1">WHEN TRIGGERED</div>
                    <div className="text-[10px] text-bloomberg-text space-y-1">
                      {positionAction === 'CLOSE' && (
                        <>
                          <div>• {strategy.positionSize && strategy.positionSize < 100 
                            ? `${strategy.positionSize}% of position will be closed`
                            : 'Position will be fully closed'}</div>
                          <div>• {strategy.positionSize && strategy.positionSize < 100 
                            ? 'Remaining position stays open'
                            : 'All contracts liquidated'}</div>
                          <div>• P&L realized on closed portion</div>
                        </>
                      )}
                      {positionAction === 'REVERSE' && (
                        <>
                          <div>• Current position closed</div>
                          <div>• Opposite position opened</div>
                          <div>• Same size & leverage</div>
                        </>
                      )}
                      {positionAction === 'CANCEL' && (
                        <>
                          <div>• Pending order cancelled</div>
                          <div>• No execution</div>
                          <div>• Capital released</div>
                        </>
                      )}
                    </div>
                  </div>
                  {/* Show exit logic */}
                  {strategy.exitLogic === 'ANY' && (
                    <div className="pt-2 border-t border-terminal">
                      <div className="text-bloomberg-text-dim text-[9px] mb-0.5">EXIT LOGIC</div>
                      <div className="text-bloomberg-orange text-[10px] font-bold">ANY condition triggers exit</div>
                      <div className="text-bloomberg-text-dim text-[8px] mt-0.5">First condition to be met will execute</div>
                    </div>
                  )}
                  <div className="pt-2 border-t border-terminal">
                    <div className="text-bloomberg-text-dim text-[9px] mb-1">CONDITIONS REQUIRED</div>
                    <div className="text-[10px] text-bloomberg-text">
                      {strategy.conditions.length} exit condition{strategy.conditions.length !== 1 ? 's' : ''}
                    </div>
                    <div className="text-bloomberg-text-dim text-[8px] mt-0.5">
                      {strategy.exitLogic === 'ANY' 
                        ? 'Any condition can trigger exit'
                        : 'All must be met to trigger'}
                    </div>
                  </div>
                </>
              ) : (
                <>
              {/* Position Summary */}
              <div className="space-y-2">
                <div>
                  <div className="text-bloomberg-text-dim text-[9px] mb-0.5">POSITION SIZE</div>
                  <div className="text-bloomberg-text text-[11px] font-bold">${positionSize.toFixed(0)}</div>
                  <div className="text-bloomberg-text-dim text-[8px] mt-0.5">
                    {positionSizePercent.toFixed(2)}% of ${accountSizeNum.toLocaleString()}
                    {strategy.positionAdjustments && strategy.positionAdjustments.length > 0 && ' (adjustable)'}
                  </div>
                </div>
                <div>
                  <div className="text-bloomberg-text-dim text-[9px] mb-0.5">NOTIONAL VALUE</div>
                  <div className="text-bloomberg-text text-[11px] font-bold">
                    ${(positionSize * leverageNum).toFixed(0)}
                  </div>
                  <div className="text-bloomberg-text-dim text-[8px] mt-0.5">
                    {leverageNum}x leverage
                  </div>
                </div>
                <div>
                  <div className="text-bloomberg-text-dim text-[9px] mb-0.5">CAPITAL AT RISK</div>
                  <div className="text-bloomberg-red text-[11px] font-bold">${capitalAtRisk.toFixed(0)}</div>
                  <div className="text-bloomberg-text-dim text-[8px] mt-0.5">
                    Max loss if stop hit
                  </div>
                </div>
              </div>

              {/* Potential Outcomes */}
              <div className="pt-2 border-t border-terminal">
                <div className="text-bloomberg-text-dim text-[9px] mb-1">POTENTIAL OUTCOMES</div>
                <div className="space-y-1 text-[10px]">
                  <div className="flex justify-between">
                    <span className="text-bloomberg-text-dim">Max Profit:</span>
                    <span className="text-bloomberg-green">+${maxProfit.toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-bloomberg-text-dim">Max Loss:</span>
                    <span className="text-bloomberg-red">-${capitalAtRisk.toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-terminal">
                    <span className="text-bloomberg-text-dim">Est. Fees:</span>
                    <span className="text-bloomberg-text-dim">-${feesImpact.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Expected Value */}
              <div className="pt-2 border-t border-terminal">
                <div className="text-bloomberg-text-dim text-[9px] mb-0.5">EXPECTED VALUE</div>
                <div className={`text-[11px] font-bold ${expectedValue > 0 ? 'text-bloomberg-green' : 'text-bloomberg-red'}`}>
                  {expectedValue > 0 ? '+' : ''}{expectedValue.toFixed(2)}%
                </div>
                <div className="text-bloomberg-text-dim text-[8px] mt-0.5">
                  (75% × {takeProfitNum}%) - (25% × {stopLossNum}%)
                </div>
                <div className="text-bloomberg-text-dim text-[8px] mt-1">
                  Assumes 75% win rate
                </div>
              </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Status Bar */}
      <div className="bg-bloomberg-panel border-t border-terminal h-6 flex items-center justify-between px-2 text-xs">
        <div className="flex items-center gap-4 text-bloomberg-text-dim">
          {isPositionManagement ? (
            <>
              <span>F1: Deploy Exit Condition</span>
              <span>F2: View Position</span>
              <span>F3: Cancel</span>
            </>
          ) : (
            <>
              <span>F1: Execute</span>
              <span>F2: Backtest</span>
              <span>F3: Export</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-3 text-bloomberg-text-dim">
          {showTriggered && (
            <div className="flex items-center gap-2 px-3 py-1 bg-bloomberg-green/30 border-2 border-bloomberg-green animate-pulse">
              <span className="text-bloomberg-green font-bold text-xs">● TRIGGERED</span>
              <span className="text-bloomberg-text-dim">|</span>
              <span className="text-bloomberg-green text-xs font-bold">Press → or SPACE to continue</span>
            </div>
          )}
          {!showTriggered && !isPositionManagement && (
            <>
              <span>EV: <span className={`font-bold ${expectedValue > 0 ? 'text-bloomberg-green' : 'text-bloomberg-red'}`}>{expectedValue > 0 ? '+' : ''}{expectedValue.toFixed(2)}%</span></span>
              <span>|</span>
              <span>R/R: <span className="text-bloomberg-text">1:{riskReward.toFixed(1)}</span></span>
              <span>|</span>
              <span>Risk: <span className="text-bloomberg-red">${capitalAtRisk.toFixed(0)}</span></span>
            </>
          )}
          {!showTriggered && isPositionManagement && (
            <>
              <span>Action: <span className={`font-bold ${
                positionAction === 'CLOSE' ? 'text-bloomberg-red' :
                positionAction === 'REVERSE' ? 'text-bloomberg-orange' :
                'text-bloomberg-text-dim'
              }`}>{positionAction}</span></span>
              <span>|</span>
              <span>Conditions: <span className="text-bloomberg-text">{strategy.conditions.length}</span></span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
