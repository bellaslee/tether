'use client';

import '@xyflow/react/dist/style.css';

import Link from 'next/link';
import {
  BaseEdge,
  Controls,
  EdgeLabelRenderer,
  type Edge,
  type EdgeProps,
  getStraightPath,
  Handle,
  type Node,
  type NodeProps,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
} from '@xyflow/react';
import { forceCenter, forceCollide, forceLink, forceManyBody, forceSimulation } from 'd3-force';
import type { CSSProperties, MouseEvent as ReactMouseEvent } from 'react';
import { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { personShownName } from '@/lib/people/list-name';

const SIM_WIDTH = 880;
const SIM_HEIGHT = 540;
const TICKS_DEFAULT = 320;
const TICKS_REDUCED_MOTION = 72;

/** Solid fills from the palette (coral · sun · sky) — index is stable per person id. */
const GRAPH_NODE_FILL_VARS = [
  'var(--accent)',
  'var(--accent-sun)',
  'var(--accent-sky)',
] as const;

function graphPersonFillVar(personId: string): string {
  let h = 0;
  for (let i = 0; i < personId.length; i++) {
    h = (h * 31 + personId.charCodeAt(i)) >>> 0;
  }
  return GRAPH_NODE_FILL_VARS[h % GRAPH_NODE_FILL_VARS.length];
}

export type PeopleRelationshipGraphPerson = {
  id: string;
  full_name: string;
  display_name: string | null;
};

export type PeopleRelationshipGraphLink = {
  id: string;
  sourcePersonId: string;
  targetPersonId: string;
  connectionLabels: string;
};

type HoverTarget =
  | { kind: 'node'; id: string }
  | { kind: 'edge'; id: string };

type PersonNodeData = {
  label: string;
  /** CSS `background` color (theme var) */
  fill: string;
  faded: boolean;
  /** Dot ring when pointer is on this node */
  nodeHovered: boolean;
};

type RelationshipEdgeData = {
  connectionLabel: string;
  faded: boolean;
  showLabel: boolean;
};

/** Dot + handle box (px) — matches Tailwind `size-9` circle. */
const DOT_BOX_PX = 36;
/** Center handles on the circle so edges read as radial, not diagonal corner ties. */
function PersonGraphNode({ id, data }: NodeProps<Node<PersonNodeData, 'person'>>) {
  const dotHalf = DOT_BOX_PX / 2;
  /** Invisible anchors at dot center — width/height for interaction hitbox. */
  const handleStyle = {
    left: dotHalf,
    top: dotHalf,
    transform: 'translate(-50%, -50%)',
  } as const;
  const handleCls =
    '!absolute !size-px !min-h-px !min-w-px !border-0 !bg-transparent !opacity-0';

  /**
   * Keep the React Flow node bounds equal to the dot only so `onNodeMouseEnter`
   * does not fire in the empty margin/label area. Label is absolutely positioned
   * with `overflow: visible` on the flow node.
   */
  return (
    <div
      className="relative box-border transition-opacity duration-150 ease-out motion-reduce:transition-none"
      style={{
        width: DOT_BOX_PX,
        height: DOT_BOX_PX,
        opacity: data.faded ? 0.22 : 1,
        overflow: 'visible',
      }}
    >
      <Handle
        id="in"
        type="target"
        position={Position.Top}
        aria-hidden
        style={handleStyle}
        className={handleCls}
      />
      <Handle
        id="out"
        type="source"
        position={Position.Bottom}
        aria-hidden
        style={handleStyle}
        className={handleCls}
      />
      <Link
        href={`/people/${id}`}
        aria-label={`Open profile for ${data.label}`}
        className="group absolute left-0 top-0 outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
      >
        <span
          aria-hidden
          style={{ backgroundColor: data.fill }}
          className={`size-9 block rounded-full border-2 border-surface-strong shadow-[0_2px_10px_-3px_rgb(42_38_36/0.22)] transition-[box-shadow,ring-width] duration-150 group-hover:shadow-[0_3px_14px_-2px_rgb(42_38_36/0.28)] motion-reduce:transition-none dark:shadow-[0_2px_12px_-3px_rgb(0_0_0/0.6)] ${
            data.nodeHovered ? 'ring-2 ring-white/95' : 'ring-0 ring-transparent'
          }`}
        />
      </Link>
      <p className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 max-w-[10rem] -translate-x-1/2 text-center text-[11px] font-semibold leading-snug text-foreground drop-shadow-sm dark:drop-shadow-[0_1px_2px_rgb(0_0_0/0.8)]">
        {data.label}
      </p>
    </div>
  );
}

function RelationshipEdge(
  props: EdgeProps<Edge<RelationshipEdgeData, 'relationship'>>,
) {
  const { id, sourceX, sourceY, targetX, targetY, data } = props;
  const [edgePath] = getStraightPath({ sourceX, sourceY, targetX, targetY });
  const label = data?.connectionLabel ?? '';
  const faded = data?.faded ?? false;
  /** Hover on edge or endpoints — stronger stroke only; labels stay visible always. */
  const emphasized = data?.showLabel ?? false;

  const midX = (sourceX + targetX) / 2;
  const midY = (sourceY + targetY) / 2;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        interactionWidth={22}
        style={{
          stroke: 'var(--graph-edge-stroke)',
          strokeWidth: emphasized ? 2.25 : 1.75,
          strokeOpacity: faded ? 0.12 : emphasized ? 1 : 0.78,
        }}
      />
      {label.length > 0 ? (
        <EdgeLabelRenderer>
          <div
            className={`pointer-events-none max-w-[15rem] rounded-md bg-surface/90 px-1.5 py-0.5 text-center text-[11px] font-medium leading-snug backdrop-blur-sm ${
              emphasized ? 'text-foreground' : 'text-muted'
            }`}
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${midX}px,${midY}px)`,
              opacity: faded ? 0.28 : emphasized ? 1 : 0.88,
              boxShadow: 'none',
            }}
            aria-hidden
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      ) : null}
    </>
  );
}

const nodeTypes = {
  person: PersonGraphNode,
};

const edgeTypes = {
  relationship: RelationshipEdge,
};

function computeActiveSets(
  hover: HoverTarget | null,
  edges: { id: string; source: string; target: string }[],
): {
  activeNodes: Set<string> | null;
  activeEdges: Set<string> | null;
} {
  if (!hover) {
    return { activeNodes: null, activeEdges: null };
  }
  if (hover.kind === 'node') {
    const activeEdges = new Set<string>();
    for (const e of edges) {
      if (e.source === hover.id || e.target === hover.id) {
        activeEdges.add(e.id);
      }
    }
    const activeNodes = new Set<string>([hover.id]);
    for (const e of edges) {
      if (activeEdges.has(e.id)) {
        activeNodes.add(e.source);
        activeNodes.add(e.target);
      }
    }
    return { activeNodes, activeEdges };
  }
  const edge = edges.find((e) => e.id === hover.id);
  if (!edge) {
    return { activeNodes: null, activeEdges: null };
  }
  return {
    activeNodes: new Set([edge.source, edge.target]),
    activeEdges: new Set([hover.id]),
  };
}

type PersonFlowNode = Node<PersonNodeData, 'person'>;
type RelationshipFlowEdge = Edge<RelationshipEdgeData, 'relationship'>;

function FlowCanvas({
  people,
  links,
}: {
  people: PeopleRelationshipGraphPerson[];
  links: PeopleRelationshipGraphLink[];
}) {
  const [hover, setHover] = useState<HoverTarget | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<PersonFlowNode>([]);
  const [edges, setEdges, onEdgesChange] =
    useEdgesState<RelationshipFlowEdge>([]);

  useLayoutEffect(() => {
    if (people.length === 0) {
      setNodes([]);
      setEdges([]);
      return;
    }

    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ticks = reducedMotion ? TICKS_REDUCED_MOTION : TICKS_DEFAULT;

    type SimNode = { id: string; x?: number; y?: number; fx?: number; fy?: number };
    type SimLink = { source: string; target: string };

    const simNodes: SimNode[] = people.map((p) => ({ id: p.id }));
    const simLinks: SimLink[] = links.map((l) => ({
      source: l.sourcePersonId,
      target: l.targetPersonId,
    }));

    const sim = forceSimulation<SimNode>(simNodes)
      .force(
        'link',
        forceLink<SimNode, SimLink>(simLinks)
          .id((d: SimNode) => d.id)
          .distance(174)
          .strength(0.48),
      )
      .force('charge', forceManyBody().strength(-320))
      .force('center', forceCenter(SIM_WIDTH / 2, SIM_HEIGHT / 2))
      .force(
        'collide',
        forceCollide().radius(Math.ceil(DOT_BOX_PX / 2) + 4),
      )
      .alphaDecay(0.045)
      .velocityDecay(0.33);

    for (let i = 0; i < ticks; i += 1) {
      sim.tick();
    }
    sim.stop();

    const byId = new Map(people.map((p) => [p.id, p]));
    const flowNodes: PersonFlowNode[] = simNodes.map((n) => {
      const p = byId.get(n.id);
      const label = p ? personShownName(p) : n.id;
      return {
        id: n.id,
        type: 'person',
        position: { x: n.x ?? SIM_WIDTH / 2, y: n.y ?? SIM_HEIGHT / 2 },
        style: { overflow: 'visible' },
        data: {
          label,
          fill: graphPersonFillVar(n.id),
          faded: false,
          nodeHovered: false,
        },
        draggable: false,
        selectable: false,
        focusable: true,
        width: DOT_BOX_PX,
        height: DOT_BOX_PX,
      };
    });

    const flowEdges: RelationshipFlowEdge[] = links.map((l) => ({
      id: l.id,
      type: 'relationship',
      source: l.sourcePersonId,
      sourceHandle: 'out',
      target: l.targetPersonId,
      targetHandle: 'in',
      data: {
        connectionLabel: l.connectionLabels,
        faded: false,
        showLabel: false,
      },
      selectable: false,
      focusable: false,
    }));

    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [people, links, setEdges, setNodes]);

  const edgeIndex = useMemo(
    () => edges.map((e) => ({ id: e.id, source: e.source, target: e.target })),
    [edges],
  );

  const { activeNodes, activeEdges } = useMemo(
    () => computeActiveSets(hover, edgeIndex),
    [hover, edgeIndex],
  );

  const displayNodes = useMemo(
    () =>
      nodes.map((n) => {
        const faded =
          activeNodes != null && !activeNodes.has(n.id) ? true : false;
        const nodeHovered =
          hover?.kind === 'node' && hover.id === n.id ? true : false;
        return {
          ...n,
          data: {
            ...(n.data as PersonNodeData),
            faded,
            nodeHovered,
          },
        };
      }),
    [nodes, activeNodes, hover],
  );

  const displayEdges = useMemo(
    () =>
      edges.map((e) => {
        const faded = activeEdges != null && !activeEdges.has(e.id);
        const showLabel =
          hover != null &&
          (hover.kind === 'edge'
            ? hover.id === e.id
            : hover.id === e.source || hover.id === e.target);
        return {
          ...e,
          data: {
            ...(e.data as RelationshipEdgeData),
            faded,
            showLabel,
          },
        };
      }),
    [edges, activeEdges, hover],
  );

  const onNodeMouseEnter = useCallback(
    (_: ReactMouseEvent, node: PersonFlowNode) => {
      setHover({ kind: 'node', id: node.id });
    },
    [],
  );

  const onNodeMouseLeave = useCallback(() => {
    setHover(null);
  }, []);

  const onEdgeMouseEnter = useCallback(
    (_: ReactMouseEvent, edge: RelationshipFlowEdge) => {
      setHover({ kind: 'edge', id: edge.id });
    },
    [],
  );

  const onEdgeMouseLeave = useCallback(() => {
    setHover(null);
  }, []);

  return (
    <div
      className="people-relationship-graph-flow relative w-full overflow-hidden"
      style={
        {
          height: '82dvh',
          width: '100%',
          ['--graph-edge-stroke' as string]: 'var(--accent-sky)',
        } as CSSProperties
      }
    >
      <ReactFlow<PersonFlowNode, RelationshipFlowEdge>
        nodes={displayNodes}
        edges={displayEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        minZoom={0.35}
        maxZoom={1.65}
        fitView
        fitViewOptions={{ padding: 0.18 }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnScroll
        zoomOnScroll
        zoomOnPinch
        proOptions={{ hideAttribution: true }}
        onNodeMouseEnter={onNodeMouseEnter}
        onNodeMouseLeave={onNodeMouseLeave}
        onEdgeMouseEnter={onEdgeMouseEnter}
        onEdgeMouseLeave={onEdgeMouseLeave}
        className="h-full w-full !bg-transparent"
      >
        <Controls
          position="bottom-right"
          orientation="vertical"
          showInteractive={false}
          showZoom
          showFitView
          fitViewOptions={{ padding: 0.18, duration: 200 }}
          aria-label="Zoom and recenter graph"
          className="!m-3 !rounded-2xl !border-border-soft !border !bg-surface-strong !shadow-[var(--shadow-lift)] backdrop-blur-sm [&_button]:text-foreground [&_button:hover]:bg-surface [&_svg]:fill-current"
        />
      </ReactFlow>
    </div>
  );
}

export function PeopleRelationshipGraph({
  people,
  links,
}: {
  people: PeopleRelationshipGraphPerson[];
  links: PeopleRelationshipGraphLink[];
}) {
  return (
    <ReactFlowProvider>
      <FlowCanvas people={people} links={links} />
    </ReactFlowProvider>
  );
}
