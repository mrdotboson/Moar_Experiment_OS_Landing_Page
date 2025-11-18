'use client'

import { useState } from 'react'
import IFTTTCommandBuilder from './IFTTTCommandBuilder'

/**
 * Standalone demo component to test IFTTTCommandBuilder
 * This shows how it would integrate into your app
 * 
 * Usage in your app:
 * ```tsx
 * import IFTTTCommandBuilder from '@/components/IFTTTCommandBuilder'
 * 
 * <IFTTTCommandBuilder 
 *   onSubmit={(command) => {
 *     // Handle command submission
 *     console.log('Command:', command)
 *     // Call your existing parseStrategy or onSubmit handler
 *   }}
 * />
 * ```
 */
export default function IFTTTCommandBuilderDemo() {
  const [submittedCommand, setSubmittedCommand] = useState<string>('')
  const [commandHistory, setCommandHistory] = useState<string[]>([])

  const handleSubmit = (command: string) => {
    console.log('Command submitted:', command)
    setSubmittedCommand(command)
    setCommandHistory(prev => [command, ...prev.slice(0, 4)])
    
    // Here you would call your existing onSubmit handler
    // For example: onSubmit(command) or parseStrategy(command)
  }

  return (
    <div className="min-h-screen bg-bloomberg-bg p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-[#8B5CF6] to-[#00FF88] bg-clip-text text-transparent">
            IFTTT Command Builder Demo
          </h1>
          <p className="text-bloomberg-text-dim text-sm">
            Isolated test component - matches your app's patterns
          </p>
        </div>

        {/* Main Builder */}
        <div className="bg-bloomberg-panel border border-terminal rounded-lg p-6 mb-6">
          <IFTTTCommandBuilder 
            onSubmit={handleSubmit}
            placeholder="Polymarket 'BTC ETF Approval' probability ≥ 75% and price above $45,000 then close SOL long position"
          />
        </div>

        {/* Submitted Command Display */}
        {submittedCommand && (
          <div className="bg-bloomberg-panel border border-bloomberg-green/30 rounded-lg p-4 mb-6">
            <div className="text-bloomberg-green text-xs uppercase tracking-wider font-bold mb-2">
              Last Submitted Command
            </div>
            <div className="text-bloomberg-text font-mono text-sm">
              {submittedCommand}
            </div>
          </div>
        )}

        {/* Command History */}
        {commandHistory.length > 0 && (
          <div className="bg-bloomberg-panel border border-terminal rounded-lg p-4">
            <div className="text-bloomberg-text-dim text-xs uppercase tracking-wider font-bold mb-3">
              Command History
            </div>
            <div className="space-y-2">
              {commandHistory.map((cmd, index) => (
                <div 
                  key={index}
                  className="text-bloomberg-text-dim text-[10px] font-mono p-2 bg-bloomberg-bg rounded border border-terminal/50"
                >
                  {cmd}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Integration Notes */}
        <div className="mt-8 p-4 bg-[#8B5CF6]/10 border border-[#8B5CF6]/30 rounded-lg">
          <div className="text-[#8B5CF6] text-xs uppercase tracking-wider font-bold mb-2">
            Integration Notes
          </div>
          <div className="text-bloomberg-text-dim text-[10px] space-y-1 font-mono">
            <div>• Component matches your existing Terminal.tsx patterns</div>
            <div>• Uses same styling classes (bloomberg-*)</div>
            <div>• Follows same hook patterns (useState, useEffect, useRef)</div>
            <div>• onSubmit callback matches your existing interface</div>
            <div>• Can replace or complement existing input in Terminal component</div>
          </div>
        </div>
      </div>
    </div>
  )
}

