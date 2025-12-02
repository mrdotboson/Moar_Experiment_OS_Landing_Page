'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import { ParsedStrategy } from '@/lib/strategyParser'

interface SimulationProps {
  strategy: ParsedStrategy
  embedded?: boolean // If true, hide header/status bars (for use in tabs)
}

interface Candle {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export default function Simulation({ strategy, embedded = false }: SimulationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const volumeCanvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number | null>(null)
  const animatedStrategyRef = useRef<string | null>(null)
  const isAnimatingRef = useRef(false)
  const [currentTime, setCurrentTime] = useState('')

  // Update time on client only to avoid hydration mismatch
  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString())
    }
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  // Create a stable key for the strategy to prevent unnecessary re-animations
  const strategyKey = useMemo(() => {
    return JSON.stringify({
      asset: strategy.asset,
      action: strategy.action,
      stopLoss: strategy.stopLoss,
      takeProfit: strategy.takeProfit,
      leverage: strategy.leverage
    })
  }, [strategy.asset, strategy.action, strategy.stopLoss, strategy.takeProfit, strategy.leverage])

  useEffect(() => {
    const canvas = canvasRef.current
    const volumeCanvas = volumeCanvasRef.current
    if (!canvas || !volumeCanvas) return

    // Prevent multiple simultaneous animations
    if (isAnimatingRef.current) {
      return
    }

    const ctx = canvas.getContext('2d')
    const volumeCtx = volumeCanvas.getContext('2d')
    if (!ctx || !volumeCtx) return

    // Set canvas sizes
    const container = canvas.parentElement
    if (container) {
      const rect = container.getBoundingClientRect()
      const chartHeight = Math.floor((rect.height - 60) * 0.7) // 70% for price, 30% for volume
      const volumeHeight = Math.floor((rect.height - 60) * 0.3)
      
      canvas.width = rect.width - 16
      canvas.height = chartHeight
      
      volumeCanvas.width = rect.width - 16
      volumeCanvas.height = volumeHeight
    }

    const width = canvas.width
    const chartHeight = canvas.height
    const volumeHeight = volumeCanvas.height

    // Generate realistic OHLC candlestick data (TradingView quality)
    const generateCandles = (count: number): Candle[] => {
      const candles: Candle[] = []
      let basePrice = 3042
      let momentum = 0 // Track price momentum for more realistic movement
      
      // Create realistic price movement with trend
      for (let i = 0; i < count; i++) {
        const open = i === 0 ? basePrice : candles[i - 1].close
        
        // More realistic trend: gradual upward with natural pullbacks
        const progress = i / count
        const baseTrend = progress * 0.15 // Overall 15% gain over period
        
        // Add cyclical movements (market cycles)
        const cycle1 = Math.sin(i / 40) * 0.08 // Longer cycle
        const cycle2 = Math.sin(i / 12) * 0.03 // Shorter cycle
        
        // Momentum-based movement (price tends to continue direction)
        momentum = momentum * 0.7 + (Math.random() - 0.5) * 0.3
        
        // Volatility varies - lower during consolidation, higher during moves
        const isConsolidating = Math.abs(momentum) < 0.1
        const baseVolatility = isConsolidating ? 3 : 6
        const volatility = baseVolatility + Math.random() * 4 // Much lower volatility
        
        // Price change with momentum and cycles
        const trendComponent = baseTrend + cycle1 + cycle2
        const change = (trendComponent + momentum) * volatility
        
        // Clamp change to prevent extreme moves
        const clampedChange = Math.max(-volatility * 2, Math.min(volatility * 2, change))
        const close = open + clampedChange
        
        // Realistic high/low with wicks (not all candles have huge wicks)
        const bodyRange = Math.abs(close - open)
        const hasWick = Math.random() > 0.3 // 70% of candles have wicks
        const wickMultiplier = hasWick ? (0.3 + Math.random() * 0.4) : 0.1 // Smaller wicks
        const wickSize = bodyRange * wickMultiplier + (Math.random() * volatility * 0.3)
        
        const high = Math.max(open, close) + wickSize
        const low = Math.min(open, close) - wickSize
        
        // Volume correlates more realistically with price action
        const priceChangePercent = Math.abs(clampedChange) / open
        const isBigMove = priceChangePercent > 0.002 // > 0.2% move
        const isReversal = i > 0 && Math.sign(close - open) !== Math.sign(open - candles[i - 1].open)
        
        // Base volume with realistic variation
        const baseVolume = 80000000 + Math.random() * 40000000 // 80-120M base
        
        // Volume spikes on big moves and reversals
        let volumeMultiplier = 1.0
        if (isBigMove) volumeMultiplier = 1.5 + Math.random() * 0.5 // 1.5-2x on big moves
        if (isReversal) volumeMultiplier = 1.3 + Math.random() * 0.4 // Higher on reversals
        if (isConsolidating) volumeMultiplier = 0.7 + Math.random() * 0.3 // Lower during consolidation
        
        const volume = baseVolume * volumeMultiplier
        
        candles.push({ time: i, open, high, low, close, volume })
        basePrice = close
      }
      
      return candles
    }

    const candles = generateCandles(150)
    const minPrice = Math.min(...candles.map(c => c.low))
    const maxPrice = Math.max(...candles.map(c => c.high))
    const priceRange = maxPrice - minPrice
    const padding = priceRange * 0.1

    // Calculate entry/exit points
    const entryIndex = Math.floor(candles.length * 0.25)
    const exitIndex = Math.floor(candles.length * 0.75)
    const entryPrice = candles[entryIndex].close
    const exitPrice = candles[exitIndex].close
    const isLong = strategy.action === 'LONG'

    // Price to Y coordinate
    const priceToY = (price: number) => {
      const normalized = (price - minPrice + padding) / (priceRange + padding * 2)
      return chartHeight - (normalized * chartHeight * 0.9 + chartHeight * 0.05)
    }

    // Draw TradingView-style chart
    const drawChart = (progress: number) => {
      const visibleCandles = Math.floor(candles.length * progress)
      
      // Clear canvases
      ctx.clearRect(0, 0, width, chartHeight)
      volumeCtx.clearRect(0, 0, width, volumeHeight)
      
      if (visibleCandles === 0) return

      const candleWidth = Math.max(2, (width / visibleCandles) * 0.8)
      const candleSpacing = width / visibleCandles

      // Draw grid lines (horizontal)
      ctx.strokeStyle = '#333333'
      ctx.lineWidth = 1
      for (let i = 0; i <= 5; i++) {
        const y = (chartHeight / 5) * i
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(width, y)
        ctx.stroke()
        
        // Price labels
        const price = maxPrice - (priceRange / 5) * i
        ctx.fillStyle = '#999999'
        ctx.font = '10px monospace'
        ctx.textAlign = 'left'
        ctx.fillText(`$${price.toFixed(2)}`, 4, y + 3)
      }

      // Draw vertical grid lines (time axis)
      const timeDivisions = 6
      for (let i = 0; i <= timeDivisions; i++) {
        const x = (width / timeDivisions) * i
        ctx.strokeStyle = '#222222'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, chartHeight)
        ctx.stroke()
        
        // Time labels
        if (i > 0 && i < timeDivisions) {
          const timePercent = i / timeDivisions
          const hours = Math.floor(timePercent * 2.5)
          const minutes = Math.floor((timePercent * 2.5 - hours) * 60)
          ctx.fillStyle = '#666666'
          ctx.font = '9px monospace'
          ctx.textAlign = 'center'
          ctx.fillText(`${hours}h${minutes.toString().padStart(2, '0')}m`, x, chartHeight - 2)
        }
      }

      // Draw volume bars (matching candlestick colors)
      const maxVolume = Math.max(...candles.map(c => c.volume))
      for (let i = 0; i < visibleCandles; i++) {
        const candle = candles[i]
        const x = i * candleSpacing + candleSpacing * 0.1
        const barHeight = (candle.volume / maxVolume) * volumeHeight * 0.85
        const isUp = candle.close >= candle.open
        
        // Match candlestick colors for consistency (realistic TradingView style)
        volumeCtx.fillStyle = isUp ? '#26A69A' : '#EF5350'
        volumeCtx.fillRect(x, volumeHeight - barHeight, candleWidth, barHeight)
        
        // Subtle outline
        volumeCtx.strokeStyle = isUp ? '#1E8E82' : '#D32F2F'
        volumeCtx.lineWidth = 0.5
        volumeCtx.strokeRect(x, volumeHeight - barHeight, candleWidth, barHeight)
      }

      // Draw candlesticks (TradingView style - more realistic)
      for (let i = 0; i < visibleCandles; i++) {
        const candle = candles[i]
        const x = i * candleSpacing + candleSpacing * 0.1 + candleWidth / 2
        const openY = priceToY(candle.open)
        const closeY = priceToY(candle.close)
        const highY = priceToY(candle.high)
        const lowY = priceToY(candle.low)
        
        const isUp = candle.close >= candle.open
        // More realistic colors - slightly muted, professional
        const wickColor = isUp ? '#26A69A' : '#EF5350' // Teal for up, red for down
        const bodyColor = isUp ? '#26A69A' : '#EF5350'
        const bodyBorderColor = isUp ? '#1E8E82' : '#D32F2F' // Slightly darker border
        
        // Draw wick (thin line, only if there's a wick)
        const hasWick = Math.abs(highY - lowY) > Math.abs(openY - closeY) + 2
        if (hasWick) {
          ctx.strokeStyle = wickColor
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.moveTo(x, highY)
          ctx.lineTo(x, lowY)
          ctx.stroke()
        }
        
        // Draw body (filled rectangle with proper sizing)
        const bodyTop = Math.min(openY, closeY)
        const bodyBottom = Math.max(openY, closeY)
        const bodyHeight = Math.max(1, bodyBottom - bodyTop) // Minimum 1px for visibility
        
        // Fill body with slight transparency for depth
        ctx.fillStyle = bodyColor
        ctx.fillRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight)
        
        // Draw body outline (subtle border)
        ctx.strokeStyle = bodyBorderColor
        ctx.lineWidth = 0.5
        ctx.strokeRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight)
      }

      // Draw EMA lines (smooth moving average)
      const emaPeriod = 21
      if (visibleCandles > emaPeriod) {
        const emaValues: number[] = []
        for (let i = 0; i < visibleCandles; i++) {
          if (i < emaPeriod - 1) {
            emaValues.push(candles[i].close)
          } else {
            const multiplier = 2 / (emaPeriod + 1)
            const prevEMA = emaValues[i - 1]
            emaValues.push((candles[i].close - prevEMA) * multiplier + prevEMA)
          }
        }

        // Draw EMA line with smooth rendering
        ctx.strokeStyle = '#FF6600'
        ctx.lineWidth = 2
        ctx.setLineDash([])
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.beginPath()
        for (let i = emaPeriod - 1; i < visibleCandles; i++) {
          const x = i * candleSpacing + candleSpacing * 0.1 + candleWidth / 2
          const y = priceToY(emaValues[i])
          if (i === emaPeriod - 1) {
            ctx.moveTo(x, y)
          } else {
            ctx.lineTo(x, y)
          }
        }
        ctx.stroke()
        
        // Draw EMA label at end
        if (visibleCandles > emaPeriod) {
          const lastX = (visibleCandles - 1) * candleSpacing + candleSpacing * 0.1 + candleWidth / 2
          const lastY = priceToY(emaValues[visibleCandles - 1])
          ctx.fillStyle = '#FF6600'
          ctx.font = 'bold 10px monospace'
          ctx.textAlign = 'left'
          ctx.fillText(`EMA(${emaPeriod}): $${emaValues[visibleCandles - 1].toFixed(2)}`, lastX + 6, lastY)
        }
      }

      // Draw entry/exit markers
      if (progress > 0.25) {
        const entryX = entryIndex * candleSpacing + candleSpacing * 0.1 + candleWidth / 2
        const entryY = priceToY(entryPrice)
        
        // Entry marker (arrow pointing up)
        ctx.fillStyle = '#00FF88'
        ctx.beginPath()
        ctx.arc(entryX, entryY, 6, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = '#0A0A0A'
        ctx.lineWidth = 2
        ctx.stroke()
        
        // Entry arrow
        ctx.fillStyle = '#00FF88'
        ctx.beginPath()
        ctx.moveTo(entryX, entryY - 10)
        ctx.lineTo(entryX - 4, entryY - 4)
        ctx.lineTo(entryX + 4, entryY - 4)
        ctx.closePath()
        ctx.fill()
        
        // Entry label with background
        ctx.fillStyle = '#0A0A0A'
        ctx.fillRect(entryX + 10, entryY - 18, 45, 12)
        ctx.fillStyle = '#00FF88'
        ctx.font = 'bold 10px monospace'
        ctx.textAlign = 'left'
        ctx.fillText('ENTRY', entryX + 12, entryY - 8)
      }

      if (progress > 0.75) {
        const exitX = exitIndex * candleSpacing + candleSpacing * 0.1 + candleWidth / 2
        const exitY = priceToY(exitPrice)
        
        // Exit marker (arrow pointing down)
        ctx.fillStyle = '#FF4444'
        ctx.beginPath()
        ctx.arc(exitX, exitY, 6, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = '#0A0A0A'
        ctx.lineWidth = 2
        ctx.stroke()
        
        // Exit arrow
        ctx.fillStyle = '#FF4444'
        ctx.beginPath()
        ctx.moveTo(exitX, exitY + 10)
        ctx.lineTo(exitX - 4, exitY + 4)
        ctx.lineTo(exitX + 4, exitY + 4)
        ctx.closePath()
        ctx.fill()
        
        // Exit label with background
        ctx.fillStyle = '#0A0A0A'
        ctx.fillRect(exitX + 10, exitY - 18, 40, 12)
        ctx.fillStyle = '#FF4444'
        ctx.font = 'bold 10px monospace'
        ctx.textAlign = 'left'
        ctx.fillText('EXIT', exitX + 12, exitY - 8)
        
        // PnL line
        if (progress > 0.75) {
          const entryX = entryIndex * candleSpacing + candleSpacing * 0.1 + candleWidth / 2
          const entryY = priceToY(entryPrice)
          
          ctx.strokeStyle = '#00FF88'
          ctx.lineWidth = 2
          ctx.setLineDash([4, 4])
          ctx.beginPath()
          ctx.moveTo(entryX, entryY)
          ctx.lineTo(exitX, exitY)
          ctx.stroke()
          ctx.setLineDash([])
        }
      }

      // Draw current price line
      if (visibleCandles > 0) {
        const lastCandle = candles[visibleCandles - 1]
        const currentPrice = lastCandle.close
        const priceY = priceToY(currentPrice)
        
        // Horizontal price line
        ctx.strokeStyle = '#FF6600'
        ctx.lineWidth = 1
        ctx.setLineDash([4, 4])
        ctx.beginPath()
        ctx.moveTo(0, priceY)
        ctx.lineTo(width, priceY)
        ctx.stroke()
        ctx.setLineDash([])
        
        // Price label on right
        ctx.fillStyle = '#FF6600'
        ctx.font = 'bold 11px monospace'
        ctx.textAlign = 'right'
        ctx.fillText(`$${currentPrice.toFixed(2)}`, width - 4, priceY - 4)
        
        // Volume label
        volumeCtx.fillStyle = '#999999'
        volumeCtx.font = '9px monospace'
        volumeCtx.textAlign = 'right'
        const volumeText = (lastCandle.volume / 1000000).toFixed(1) + 'M'
        volumeCtx.fillText(volumeText, width - 4, volumeHeight - 2)
      }
    }

    // If we've already animated this exact strategy, just draw the final state
    if (animatedStrategyRef.current === strategyKey) {
      drawChart(1)
      return
    }

    // Cancel any existing animation
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
      isAnimatingRef.current = false
    }

    let startTime: number | null = null
    const duration = 4000

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const elapsed = timestamp - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // Ease out for smoother animation
      const easedProgress = 1 - Math.pow(1 - progress, 3)
      
      drawChart(easedProgress)
      
      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate)
      } else {
        // Final render at 100%
        drawChart(1)
        animatedStrategyRef.current = strategyKey
        animationFrameRef.current = null
        isAnimatingRef.current = false
      }
    }

    // Mark as animating and start
    isAnimatingRef.current = true
    const timeoutId = setTimeout(() => {
      animationFrameRef.current = requestAnimationFrame(animate)
    }, 200)

    // Cleanup function
    return () => {
      clearTimeout(timeoutId)
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
      isAnimatingRef.current = false
    }
  }, [strategyKey])

  return (
    <div className={embedded ? "relative w-full h-full bg-bloomberg-bg" : "absolute inset-0 bg-bloomberg-bg z-20"}>
      {/* Top Status Bar - Hidden when embedded */}
      {!embedded && (
      <div className="bg-bloomberg-panel border-b border-terminal h-6 flex items-center justify-between px-2 text-xs">
        <div className="flex items-center gap-4">
          <span className="text-bloomberg-orange font-bold">DEPLOY</span>
          <span className="text-bloomberg-text-dim">BACKTEST RESULTS</span>
          <span className="text-bloomberg-green">●</span>
          <span className="text-bloomberg-text-dim">HISTORICAL PERFORMANCE</span>
        </div>
        <div className="flex items-center gap-4 text-bloomberg-text-dim">
          <span>{strategy.asset}</span>
          <span>|</span>
          <span suppressHydrationWarning>{currentTime || '--:--:--'}</span>
        </div>
      </div>
      )}

      {/* Main Content - Grid Layout */}
      <div className={embedded ? "h-full grid grid-cols-4 gap-1 p-1" : "h-[calc(100%-48px)] grid grid-cols-4 gap-1 p-1"}>
        {/* Chart Panel */}
        <div className="col-span-3 bg-bloomberg-panel border border-terminal flex flex-col">
          <div className="bg-bloomberg-bg border-b border-terminal px-2 py-1 flex items-center justify-between">
            <div className="text-bloomberg-orange text-xs font-bold uppercase">PRICE CHART</div>
            <div className="flex items-center gap-4 text-[10px] text-bloomberg-text-dim">
              <span className="flex items-center gap-1">
                <span className="w-2 h-0.5 bg-bloomberg-orange"></span>
                <span>EMA(21)</span>
              </span>
              <span className="text-bloomberg-text-dim">|</span>
              <span>1m candles</span>
              <span className="text-bloomberg-text-dim">|</span>
              <span>150 bars</span>
            </div>
          </div>
          <div className="flex-1 p-2 flex flex-col gap-1 relative">
            <canvas
              ref={canvasRef}
              className="w-full flex-1 border border-terminal bg-bloomberg-bg"
            />
            <div className="h-6 border-t border-terminal flex items-center justify-between px-2 text-[10px] text-bloomberg-text-dim">
              <span>VOLUME</span>
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-bloomberg-green"></span>
                <span>Up</span>
                <span className="w-2 h-2 bg-bloomberg-red"></span>
                <span>Down</span>
              </span>
            </div>
            <canvas
              ref={volumeCanvasRef}
              className="w-full border border-terminal bg-bloomberg-bg"
              style={{ height: '80px' }}
            />
          </div>
        </div>

        {/* Right Panel - Trade Execution Data */}
        <div className="bg-bloomberg-panel border border-terminal flex flex-col">
          <div className="bg-bloomberg-bg border-b border-terminal px-2 py-1">
            <div className="text-bloomberg-orange text-xs font-bold uppercase">EXECUTION</div>
          </div>
          <div className="flex-1 p-3 overflow-auto">
            <div className="space-y-3 text-xs font-mono">
              {/* Entry/Exit - Compact */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-bloomberg-text-dim text-[9px] mb-0.5">ENTRY</div>
                  <div className="text-bloomberg-green text-[11px] font-bold">$3,042.50</div>
                </div>
                <div>
                  <div className="text-bloomberg-text-dim text-[9px] mb-0.5">EXIT</div>
                  <div className="text-bloomberg-red text-[11px] font-bold">$3,115.20</div>
                </div>
              </div>

              {/* P&L - Prominent */}
              <div className="pt-2 border-t border-terminal">
                <div className="text-bloomberg-text-dim text-[9px] mb-1">P&L</div>
                <div className="text-bloomberg-green text-lg font-bold">+{strategy.takeProfit || 4}%</div>
                <div className="text-bloomberg-text-dim text-[10px] mt-0.5">
                  +${((250000 * (strategy.stopLoss || 2) / 100) * (strategy.leverage || 2) * (strategy.takeProfit || 4) / 100).toFixed(0)}
                </div>
              </div>

              {/* Position Details */}
              <div className="pt-2 border-t border-terminal">
                <div className="text-bloomberg-text-dim text-[9px] mb-1">POSITION</div>
                <div className="space-y-1 text-[10px]">
                  <div className="flex justify-between">
                    <span className="text-bloomberg-text-dim">Size:</span>
                    <span className="text-bloomberg-text">${(250000 * (strategy.stopLoss || 2) / 100).toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-bloomberg-text-dim">Leverage:</span>
                    <span className="text-bloomberg-text">{strategy.leverage || 2}x</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-bloomberg-text-dim">Notional:</span>
                    <span className="text-bloomberg-text">${(250000 * (strategy.stopLoss || 2) / 100 * (strategy.leverage || 2)).toFixed(0)}</span>
                  </div>
                </div>
              </div>

              {/* Execution Details */}
              <div className="pt-2 border-t border-terminal">
                <div className="text-bloomberg-text-dim text-[9px] mb-1">EXECUTION</div>
                <div className="space-y-1 text-[10px]">
                  <div className="flex justify-between">
                    <span className="text-bloomberg-text-dim">Slippage:</span>
                    <span className="text-bloomberg-text">0.02%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-bloomberg-text-dim">Fees:</span>
                    <span className="text-bloomberg-text-dim">
                      ${((250000 * (strategy.stopLoss || 2) / 100) * (strategy.leverage || 2) * 0.0005 * 2).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-bloomberg-text-dim">Latency:</span>
                    <span className="text-bloomberg-green">12ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-bloomberg-text-dim">Venue:</span>
                    <span className="text-bloomberg-text">Hyperliquid</span>
                  </div>
                </div>
              </div>

              {/* Performance Metrics - Compact */}
              <div className="pt-2 border-t border-terminal">
                <div className="text-bloomberg-text-dim text-[9px] mb-1">METRICS</div>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div>
                    <div className="text-bloomberg-text-dim">Duration:</div>
                    <div className="text-bloomberg-text">2h 34m</div>
                  </div>
                  <div>
                    <div className="text-bloomberg-text-dim">Max DD:</div>
                    <div className="text-bloomberg-red">-0.8%</div>
                  </div>
                  <div>
                    <div className="text-bloomberg-text-dim">Win Rate:</div>
                    <div className="text-bloomberg-green">87.5%</div>
                  </div>
                  <div>
                    <div className="text-bloomberg-text-dim">Sharpe:</div>
                    <div className="text-bloomberg-text">2.34</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Status Bar - Hidden when embedded */}
      {!embedded && (
      <div className="bg-bloomberg-panel border-t border-terminal h-6 flex items-center justify-between px-2 text-xs">
        <div className="flex items-center gap-4 text-bloomberg-text-dim">
          <span>F1: Reset</span>
          <span>F2: Export</span>
          <span>F3: Details</span>
          <span>F4: Fullscreen</span>
        </div>
        <div className="text-bloomberg-green">
          SIMULATION COMPLETE
        </div>
      </div>
      )}
    </div>
  )
}
