'use client'

import { useMemo } from 'react'
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  Edge,
  MarkerType,
  MiniMap,
  Node,
  Position
} from 'reactflow'
import type { DataModelEdge, DataModelNode } from '@/lib/data-model/definition'
import 'reactflow/dist/style.css'

const nodePalette: Record<DataModelNode['kind'], { bg: string; border: string; label: string }> = {
  core: { bg: '#2563eb', border: '#1d4ed8', label: '#0b172a' },
  link: { bg: '#f97316', border: '#ea580c', label: '#0b172a' },
  support: { bg: '#0ea5e9', border: '#0284c7', label: '#0b172a' },
  api: { bg: '#10b981', border: '#059669', label: '#0b172a' }
}

const edgePalette: Record<
  DataModelEdge['type'],
  { stroke: string; dash?: string; marker: string; labelBg: string; labelColor: string }
> = {
  'one-to-many': {
    stroke: '#475569',
    marker: '#475569',
    labelBg: 'rgba(148, 163, 184, 0.75)',
    labelColor: '#0f172a'
  },
  'many-to-many': {
    stroke: '#ef4444',
    dash: '6 3',
    marker: '#ef4444',
    labelBg: 'rgba(248, 113, 113, 0.75)',
    labelColor: '#7f1d1d'
  },
  lookup: {
    stroke: '#d97706',
    dash: '4 4',
    marker: '#d97706',
    labelBg: 'rgba(251, 191, 36, 0.75)',
    labelColor: '#78350f'
  },
  drives: {
    stroke: '#059669',
    marker: '#059669',
    labelBg: 'rgba(45, 212, 191, 0.75)',
    labelColor: '#064e3b'
  },
  extends: {
    stroke: '#8b5cf6',
    dash: '2 2',
    marker: '#8b5cf6',
    labelBg: 'rgba(167, 139, 250, 0.75)',
    labelColor: '#4c1d95'
  },
  produces: {
    stroke: '#0ea5e9',
    dash: '8 3',
    marker: '#0ea5e9',
    labelBg: 'rgba(125, 211, 252, 0.75)',
    labelColor: '#0c4a6e'
  }
}

export interface EntityRelationshipFlowProps {
  nodes: DataModelNode[]
  edges: DataModelEdge[]
  selectedNodeId: string | null
  onSelect: (nodeId: string) => void
}

function computeNeighbors(edges: DataModelEdge[]) {
  const adjacency = new Map<string, Set<string>>()
  edges.forEach((edge) => {
    if (!adjacency.has(edge.source)) {
      adjacency.set(edge.source, new Set<string>())
    }
    if (!adjacency.has(edge.target)) {
      adjacency.set(edge.target, new Set<string>())
    }
    adjacency.get(edge.source)!.add(edge.target)
    adjacency.get(edge.target)!.add(edge.source)
  })
  return adjacency
}

export function EntityRelationshipFlow({ nodes, edges, selectedNodeId, onSelect }: EntityRelationshipFlowProps) {
  const adjacency = useMemo(() => computeNeighbors(edges), [edges])

  const neighborIds = useMemo(() => {
    if (!selectedNodeId) {
      return new Set<string>()
    }
    return new Set(adjacency.get(selectedNodeId) ?? [])
  }, [adjacency, selectedNodeId])

  const rfNodes = useMemo<Node[]>(() => {
    return nodes.map((node) => {
      const palette = nodePalette[node.kind]
      const isSelected = node.id === selectedNodeId
      const isNeighbor = neighborIds.has(node.id)
      const isDimmed = Boolean(selectedNodeId) && !isSelected && !isNeighbor

      return {
        id: node.id,
        data: { label: node.label },
        position: {
          x: node.position.x * 12,
          y: node.position.y * 8
        },
        type: 'default',
        draggable: false,
        selectable: true,
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        style: {
          background: palette.bg,
          border: `2px solid ${palette.border}`,
          borderRadius: 12,
          color: palette.label,
          fontWeight: isSelected ? 700 : 600,
          fontSize: 14,
          padding: '8px 12px',
          boxShadow: isSelected
            ? '0 10px 25px -12px rgba(37, 99, 235, 0.65)'
            : '0 8px 20px -16px rgba(15, 23, 42, 0.6)',
          opacity: isDimmed ? 0.35 : 1,
          transition: 'opacity 150ms ease, box-shadow 150ms ease'
        }
      }
    })
  }, [nodes, neighborIds, selectedNodeId])

  const rfEdges = useMemo<Edge[]>(() => {
    return edges.map((edge) => {
      const palette = edgePalette[edge.type]
      const isHighlighted =
        !selectedNodeId ||
        edge.source === selectedNodeId ||
        edge.target === selectedNodeId ||
        neighborIds.has(edge.source) ||
        neighborIds.has(edge.target)

      return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: 'smoothstep',
        label: edge.type.replace(/-/g, ' '),
        labelStyle: {
          fontSize: 11,
          fill: palette.labelColor,
          fontWeight: 600
        },
        labelBgPadding: [6, 4],
        labelBgBorderRadius: 6,
        labelBgStyle: {
          fill: palette.labelBg,
          stroke: 'transparent'
        },
        animated: edge.type === 'drives' || edge.type === 'produces',
        selectable: false,
        style: {
          stroke: palette.stroke,
          strokeWidth: isHighlighted ? 3 : 1.4,
          opacity: isHighlighted ? 0.9 : 0.18,
          strokeDasharray: palette.dash,
          transition: 'opacity 150ms ease, stroke-width 150ms ease'
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: palette.marker,
          width: 20,
          height: 20
        }
      }
    })
  }, [edges, neighborIds, selectedNodeId])

  return (
    <div className="h-[460px] w-full">
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        fitView
        fitViewOptions={{ padding: 0.2, minZoom: 0.5, maxZoom: 1.5 }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable
        panOnDrag
        onNodeClick={(_, node) => onSelect(node.id)}
        onNodeDoubleClick={(_, node) => onSelect(node.id)}
        className="bg-slate-50/70 dark:bg-slate-900/40"
      >
        <Background variant={BackgroundVariant.Dots} gap={18} size={1} color="#cbd5f5" />
        <Controls position="bottom-right" showInteractive={false} className="!bg-white/90 !text-slate-600" />
        <MiniMap
          nodeColor={(node) => {
            const palette = nodePalette[nodes.find((item) => item.id === node.id)?.kind ?? 'support']
            return palette.bg
          }}
          nodeStrokeColor={(node) => nodePalette[nodes.find((item) => item.id === node.id)?.kind ?? 'support'].border}
          maskColor="rgba(15, 23, 42, 0.1)"
        />
      </ReactFlow>
    </div>
  )
}
