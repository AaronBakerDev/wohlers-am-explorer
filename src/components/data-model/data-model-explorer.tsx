'use client'

import { useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import {
  dataModelEdges,
  dataModelJourneys,
  dataModelNodes,
  type DataModelEdge,
  type DataModelNode
} from '@/lib/data-model/definition'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

const nodeKindCopy: Record<DataModelNode['kind'], { label: string; summary: string }> = {
  core: { label: 'Core Entity', summary: 'Primary tables keyed by `id` that anchor relationships.' },
  link: { label: 'Link Table', summary: 'Join tables materializing many-to-many relationships.' },
  support: { label: 'Support Structure', summary: 'Config or helper records the UI reuses across datasets.' },
  api: { label: 'API Contract', summary: 'Request/response shapes that front-end experiences consume.' }
}

const relationshipCopy: Record<DataModelEdge['type'], { label: string; tone: string }> = {
  'one-to-many': { label: '1 → N', tone: 'bg-blue-500/10 text-blue-600 dark:text-blue-300' },
  'many-to-many': { label: 'N ↔ N', tone: 'bg-rose-500/10 text-rose-600 dark:text-rose-300' },
  lookup: { label: 'Lookup', tone: 'bg-amber-500/10 text-amber-600 dark:text-amber-300' },
  drives: { label: 'Drives', tone: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300' },
  extends: { label: 'Extends', tone: 'bg-purple-500/10 text-purple-600 dark:text-purple-300' },
  produces: { label: 'Produces', tone: 'bg-sky-500/10 text-sky-600 dark:text-sky-300' }
}

const sortedEdges = [...dataModelEdges].sort((a, b) => a.source.localeCompare(b.source))

const EntityRelationshipFlow = dynamic(
  () => import('./entity-relationship-flow').then((module) => module.EntityRelationshipFlow),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[480px] w-full items-center justify-center rounded-lg border bg-muted/40 text-sm text-muted-foreground">
        Loading relationship graph…
      </div>
    )
  }
)

export function DataModelExplorer() {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(dataModelNodes[0]?.id ?? null)
  const [searchTerm, setSearchTerm] = useState('')

  const nodesById = useMemo(() => new Map(dataModelNodes.map((node) => [node.id, node])), [])
  const orderedNodes = useMemo(() => [...dataModelNodes].sort((a, b) => a.label.localeCompare(b.label)), [])

  const filteredNodes = useMemo(() => {
    if (!searchTerm.trim()) {
      return orderedNodes
    }
    const term = searchTerm.toLowerCase()
    return orderedNodes.filter((node) =>
      [node.label, node.description, node.table].some((value) => value?.toLowerCase().includes(term))
    )
  }, [orderedNodes, searchTerm])

  const selectedNode = useMemo(() => {
    if (!selectedNodeId) {
      return null
    }
    return nodesById.get(selectedNodeId) ?? null
  }, [nodesById, selectedNodeId])

  const relatedEdges = useMemo(() => {
    if (!selectedNodeId) {
      return [] as DataModelEdge[]
    }
    return dataModelEdges.filter((edge) => edge.source === selectedNodeId || edge.target === selectedNodeId)
  }, [selectedNodeId])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle className="text-2xl">Unified Data Model Explorer</CardTitle>
            <CardDescription>
              Navigate documentation on the left and explore the full-width relationship canvas on the right. Perfect for
              architecture reviews, onboarding, and data planning conversations.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(nodeKindCopy).map(([kind, copy]) => (
            <div key={kind} className="rounded-lg border bg-muted/30 p-3 shadow-sm">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'inline-flex h-2.5 w-2.5 rounded-full',
                    {
                      core: 'bg-blue-500',
                      link: 'bg-amber-500',
                      support: 'bg-sky-500',
                      api: 'bg-emerald-500'
                    }[kind as DataModelNode['kind']]
                  )}
                />
                <span className="text-sm font-medium">{copy.label}</span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{copy.summary}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)] xl:grid-cols-[360px_minmax(0,1fr)]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Navigation & Context</CardTitle>
              <CardDescription>
                Search, browse, and jump to any entity. Selecting an item updates the canvas and the contextual notes
                below.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search entities, tables, or descriptions…"
              />
              <div className="max-h-[360px] space-y-2 overflow-y-auto pr-2">
                {filteredNodes.map((node) => (
                  <button
                    key={node.id}
                    type="button"
                    onClick={() => setSelectedNodeId(node.id)}
                    className={cn(
                      'w-full rounded-lg border bg-background p-3 text-left text-sm transition hover:bg-muted/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
                      selectedNodeId === node.id && 'border-primary/60 bg-primary/10'
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold">{node.label}</span>
                      <Badge variant="outline" className="uppercase text-xs">
                        {nodeKindCopy[node.kind].label}
                      </Badge>
                    </div>
                    {node.table && <p className="mt-1 font-mono text-xs text-muted-foreground">{node.table}</p>}
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{node.description}</p>
                  </button>
                ))}
                {filteredNodes.length === 0 && (
                  <p className="text-xs text-muted-foreground">No entities matched your search.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Selected Entity</CardTitle>
              <CardDescription>
                Documentation, key fields, and downstream relationships for the focused node.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {selectedNode ? (
                <div className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-xl font-semibold">{selectedNode.label}</h3>
                      <Badge variant="secondary">{nodeKindCopy[selectedNode.kind].label}</Badge>
                      {selectedNode.table && <Badge variant="outline">{selectedNode.table}</Badge>}
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground">{selectedNode.description}</p>
                    {selectedNode.docs && (
                      <p className="text-xs text-muted-foreground">
                        Reference: <span className="font-medium">{selectedNode.docs}</span>
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Key fields</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedNode.fields.map((field) => (
                        <Badge key={field} variant="outline" className="bg-background font-mono text-xs">
                          {field}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                      Questions this answers
                    </h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      {selectedNode.sampleQuestions.map((question) => (
                        <li key={question} className="rounded-md border border-dashed border-muted-foreground/30 p-2">
                          {question}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Connected nodes</h4>
                    <div className="space-y-2">
                      {relatedEdges.map((edge) => {
                        const isSource = edge.source === selectedNode.id
                        const otherNodeId = isSource ? edge.target : edge.source
                        const otherNode = nodesById.get(otherNodeId)
                        const badgeMeta = relationshipCopy[edge.type]

                        return (
                          <button
                            key={edge.id}
                            type="button"
                            onClick={() => setSelectedNodeId(otherNodeId)}
                            className="w-full rounded-lg border bg-muted/20 p-3 text-left transition hover:bg-muted/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-semibold">{otherNode?.label ?? otherNodeId}</p>
                                <p className="text-xs text-muted-foreground">
                                  {isSource ? 'Source ↴ Target' : 'Target ↰ Source'} · {edge.description}
                                </p>
                              </div>
                              <Badge variant="outline" className={cn('uppercase tracking-wide', badgeMeta.tone)}>
                                {badgeMeta.label}
                              </Badge>
                            </div>
                          </button>
                        )
                      })}
                      {relatedEdges.length === 0 && (
                        <p className="text-xs text-muted-foreground">No explicit relationships mapped yet.</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Select a node in the navigation or canvas to see details.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Data Journeys</CardTitle>
              <CardDescription>
                Trace how core scenarios traverse entities, APIs, and UI experiences.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue={dataModelJourneys[0]?.id ?? ''} orientation="horizontal" className="w-full">
                <TabsList className="flex w-full flex-wrap gap-2 bg-muted/50 p-2">
                  {dataModelJourneys.map((journey) => (
                    <TabsTrigger key={journey.id} value={journey.id} className="flex-1 whitespace-nowrap">
                      {journey.title}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {dataModelJourneys.map((journey) => (
                  <TabsContent key={journey.id} value={journey.id} className="mt-4 space-y-4">
                    <div className="rounded-lg border bg-muted/20 p-4">
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">Scenario:</span> {journey.scenario}
                      </p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">Outcome:</span> {journey.outcome}
                      </p>
                    </div>
                    <ol className="space-y-3">
                      {journey.steps.map((step, index) => (
                        <li key={step.id} className="rounded-lg border bg-background p-4 shadow-sm">
                          <div className="flex items-start gap-3">
                            <span className="mt-1 h-6 w-6 rounded-full bg-primary/10 text-center text-sm font-semibold leading-6 text-primary">
                              {index + 1}
                            </span>
                            <div className="space-y-2">
                              <div>
                                <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                                  {step.title}
                                </p>
                                <p className="text-sm leading-relaxed text-muted-foreground">{step.summary}</p>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {step.touches.map((nodeId) => {
                                  const node = nodesById.get(nodeId)
                                  return (
                                    <Badge
                                      key={nodeId}
                                      variant="outline"
                                      className="bg-muted text-xs"
                                      onClick={() => setSelectedNodeId(nodeId)}
                                    >
                                      {node?.label ?? nodeId}
                                    </Badge>
                                  )
                                })}
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ol>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="min-h-[720px]">
            <CardHeader>
              <CardTitle>Relationship Canvas</CardTitle>
              <CardDescription>
                Pan and zoom to inspect how tables and APIs connect. The canvas stretches to make complex clusters easier
                to inspect.
              </CardDescription>
            </CardHeader>
            <CardContent className="h-full">
              <div className="h-[calc(100vh-280px)] min-h-[680px] w-full overflow-hidden rounded-xl border bg-muted/20 p-4">
                <EntityRelationshipFlow
                  nodes={dataModelNodes}
                  edges={dataModelEdges}
                  selectedNodeId={selectedNodeId}
                  onSelect={setSelectedNodeId}
                />
              </div>
              <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
                {Object.entries(relationshipCopy).map(([type, meta]) => (
                  <Badge key={type} variant="outline" className={cn('font-medium', meta.tone)}>
                    {meta.label} · {type.replace(/-/g, ' ')}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Relationship Reference</CardTitle>
              <CardDescription>
                Detailed matrix of every edge — click a row to focus the corresponding source node on the canvas.
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Source</TableHead>
                    <TableHead className="whitespace-nowrap">Relationship</TableHead>
                    <TableHead className="whitespace-nowrap">Target</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedEdges.map((edge) => {
                    const source = nodesById.get(edge.source)
                    const target = nodesById.get(edge.target)
                    const badgeMeta = relationshipCopy[edge.type]

                    return (
                      <TableRow
                        key={edge.id}
                        className="cursor-pointer hover:bg-muted/40"
                        onClick={() => setSelectedNodeId(edge.source)}
                      >
                        <TableCell className="font-medium">{source?.label ?? edge.source}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn('uppercase tracking-wide', badgeMeta.tone)}>
                            {badgeMeta.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{target?.label ?? edge.target}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{edge.description}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
