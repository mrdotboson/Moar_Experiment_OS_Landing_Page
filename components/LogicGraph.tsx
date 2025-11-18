'use client'

import { useEffect, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Text, Line } from '@react-three/drei'
import * as THREE from 'three'
import { ParsedStrategy } from '@/lib/strategyParser'

interface LogicGraphProps {
  strategy: ParsedStrategy | null
  active: boolean
}

interface Node {
  id: string
  type: 'condition' | 'action' | 'gate'
  position: [number, number, number]
  label: string
  color: string
  status?: boolean
}

function GraphNode({ node, isActive }: { node: Node; isActive: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)

  useFrame((state) => {
    if (meshRef.current && isActive) {
      meshRef.current.rotation.y += 0.01
      meshRef.current.position.y = node.position[1] + Math.sin(state.clock.elapsedTime + node.position[0]) * 0.1
    }
  })

  return (
    <group position={node.position}>
      <mesh
        ref={meshRef}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        scale={hovered ? 1.2 : 1}
      >
        <octahedronGeometry args={[0.3, 0]} />
        <meshStandardMaterial
          color={node.color}
          emissive={node.color}
          emissiveIntensity={isActive ? 0.5 : 0.2}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>
      <Text
        position={[0, -0.6, 0]}
        fontSize={0.18}
        color={node.status ? '#00FF88' : '#E0E0E0'}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#000000"
      >
        {node.label}
      </Text>
    </group>
  )
}

function ConnectionLine({ from, to, color }: { from: [number, number, number]; to: [number, number, number]; color: string }) {
  const points = [new THREE.Vector3(...from), new THREE.Vector3(...to)]
  
  return (
    <Line
      points={points}
      color={color}
      lineWidth={2}
      dashed={false}
    />
  )
}

function GraphScene({ strategy }: { strategy: ParsedStrategy }) {
  const [nodes, setNodes] = useState<Node[]>([])
  const [connections, setConnections] = useState<Array<{ from: [number, number, number]; to: [number, number, number]; color: string }>>([])
  const [conditionStatus, setConditionStatus] = useState<boolean[]>([])

  useEffect(() => {
    if (!strategy || strategy.conditions.length === 0) return

    // Generate nodes in a circular layout
    const conditionNodes: Node[] = strategy.conditions.map((cond, i) => {
      const angle = (i / strategy.conditions.length) * Math.PI * 2
      const radius = 2
      const x = Math.cos(angle) * radius
      const z = Math.sin(angle) * radius
      const y = 0

      const getConditionColor = () => {
        if (cond.eventType === 'polymarket') return '#8B5CF6'
        if (cond.eventType === 'price') return '#4488FF'
        if (cond.eventType === 'funding') return '#FFAA00'
        if (cond.eventType === 'oi') return '#00FF88'
        if (cond.eventType === 'volume') return '#FF4444'
        return '#8B5CF6'
      }

      return {
        id: `condition-${i}`,
        type: 'condition',
        position: [x, y, z],
        label: cond.description.length > 20 ? cond.description.substring(0, 20) + '...' : cond.description,
        color: getConditionColor(),
        status: false
      }
    })

    // Logic gate node in center
    const gateNode: Node = {
      id: 'gate',
      type: 'gate',
      position: [0, 0, 0],
      label: 'AND',
      color: '#8B5CF6'
    }

    // Action node above
    const actionNode: Node = {
      id: 'action',
      type: 'action',
      position: [0, 2, 0],
      label: `${strategy.action} ${strategy.asset}`,
      color: strategy.action === 'LONG' ? '#00FF88' : '#FF4444',
      status: true
    }

    setNodes([...conditionNodes, gateNode, actionNode])

    // Create connections
    const conns: Array<{ from: [number, number, number]; to: [number, number, number]; color: string }> = []
    
    // Conditions to gate
    conditionNodes.forEach(node => {
      conns.push({
        from: node.position,
        to: gateNode.position,
        color: node.color
      })
    })

    // Gate to action
    conns.push({
      from: gateNode.position,
      to: actionNode.position,
      color: '#00FF88'
    })

    setConnections(conns)

    // Initialize condition status
    setConditionStatus(strategy.conditions.map(() => false))
  }, [strategy])

  // Simulate condition status updates
  useEffect(() => {
    if (nodes.length === 0) return

    const interval = setInterval(() => {
      setConditionStatus(prev => 
        strategy.conditions.map((_, i) => Math.random() > 0.3 || i === 0)
      )
      
      setNodes(prev => prev.map(node => {
        if (node.type === 'condition') {
          const condIndex = parseInt(node.id.split('-')[1])
          return { ...node, status: conditionStatus[condIndex] ?? false }
        }
        return node
      }))
    }, 2000)

    return () => clearInterval(interval)
  }, [nodes, strategy, conditionStatus])

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#8B5CF6" />
      
      {nodes.map(node => (
        <GraphNode key={node.id} node={node} isActive={true} />
      ))}
      
      {connections.map((conn, i) => (
        <ConnectionLine key={i} from={conn.from} to={conn.to} color={conn.color} />
      ))}
      
      <OrbitControls
        enablePan={false}
        minDistance={3}
        maxDistance={8}
        autoRotate
        autoRotateSpeed={0.5}
      />
    </>
  )
}

export default function LogicGraph({ strategy, active }: LogicGraphProps) {
  if (!strategy || !active || strategy.conditions.length === 0) return null

  return (
    <div className="absolute inset-0 bg-bloomberg-bg z-0">
      {/* Top Status Bar */}
      <div className="bg-bloomberg-panel border-b border-terminal h-6 flex items-center justify-between px-2 text-xs">
        <div className="flex items-center gap-4">
          <span className="text-[#8B5CF6] font-bold">CATALYST</span>
          <span className="text-bloomberg-text-dim">LOGIC VISUALIZATION</span>
          <span className="text-bloomberg-green">●</span>
          <span className="text-bloomberg-text-dim">3D GRAPH</span>
        </div>
        <div className="text-bloomberg-text-dim">
          {strategy.conditions.length} conditions → 1 action
        </div>
      </div>

      {/* 3D Canvas */}
      <div className="h-[calc(100%-24px)]">
        <Canvas
          camera={{ position: [0, 4, 6], fov: 50 }}
          gl={{ antialias: true, alpha: true }}
        >
          <GraphScene strategy={strategy} />
        </Canvas>
      </div>
    </div>
  )
}
