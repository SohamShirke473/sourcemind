"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Background,
  Controls,
  Handle,
  Position,
  ReactFlow,
  type Edge,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import dagre from "@dagrejs/dagre";

interface MindMapNode {
  id: string;
  label: string;
  parentId: string | null;
}

interface MindMapEdge {
  from: string;
  to: string;
  label?: string;
}

interface MindmapViewerProps {
  nodes: MindMapNode[];
  edges: MindMapEdge[];
}

function MindMapNodeComponent({
  data,
}: {
  data: { label: string; isRoot?: boolean };
}) {
  if (data.isRoot) {
    return (
      <div className="flex flex-col items-center gap-1.5 rounded-xl border-2 border-primary bg-primary/10 px-5 py-3 shadow-md">
        <Handle
          type="source"
          position={Position.Right}
          className="!bg-primary"
        />
        <span className="text-sm font-bold text-primary">{data.label}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-1 rounded-xl border border-border bg-card px-4 py-2 shadow-sm">
      <Handle type="target" position={Position.Left} className="!bg-border" />
      <span className="text-xs font-semibold text-foreground">
        {data.label}
      </span>
      <Handle type="source" position={Position.Right} className="!bg-border" />
    </div>
  );
}

const nodeTypes = { mindMapNode: MindMapNodeComponent };

function layoutMindMap(
  inputNodes: MindMapNode[],
  inputEdges: MindMapEdge[],
): { nodes: Node[]; edges: Edge[] } {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: "LR",
    nodesep: 60,
    ranksep: 100,
    margins: { top: 40, right: 40, bottom: 40, left: 40 },
  });

  inputNodes.forEach((n) => {
    g.setNode(n.id, { width: 160, height: 50 });
  });
  inputEdges.forEach((e) => {
    g.setEdge(e.from, e.to);
  });

  dagre.layout(g);

  const rootId = inputNodes.find((n) => n.parentId === null)?.id;

  const flowNodes: Node[] = inputNodes.map((n) => {
    const pos = g.node(n.id);
    return {
      id: n.id,
      type: "mindMapNode",
      position: { x: pos.x - 80, y: pos.y - 25 },
      data: { label: n.label, isRoot: n.id === rootId },
    };
  });

  const flowEdges: Edge[] = inputEdges.map((e, i) => ({
    id: `e-${i}`,
    source: e.from,
    target: e.to,
    label: e.label,
    type: "smoothstep",
    animated: true,
    style: {
      stroke: "color-mix(in oklch, var(--muted-foreground) 60%, transparent)",
      strokeWidth: 2,
    },
    labelStyle: { fontSize: 10, fill: "var(--muted-foreground)" },
  }));

  return { nodes: flowNodes, edges: flowEdges };
}

export function MindmapViewer({
  nodes: inputNodes,
  edges: inputEdges,
}: MindmapViewerProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Defer until after the dialog animation completes
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setMounted(true);
      });
    });
    return () => cancelAnimationFrame(id);
  }, []);

  const { nodes, edges } = useMemo(
    () => layoutMindMap(inputNodes, inputEdges),
    [inputNodes, inputEdges],
  );

  return (
    <div style={{ height: "100%", width: "100%", position: "relative" }}>
      <style>
        {`
          .react-flow__controls-button {
            background: var(--popover) !important;
            border-color: var(--border) !important;
            fill: var(--foreground) !important;
          }
          .react-flow__controls-button svg {
            fill: var(--foreground) !important;
          }
          .react-flow__controls-button:hover {
            background: var(--muted) !important;
          }
          .react-flow__controls-button path {
            fill: var(--foreground) !important;
          }
        `}
      </style>
      {mounted ? (
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          minZoom={0.3}
          maxZoom={2}
          proOptions={{ hideAttribution: true }}
        >
          <Background
            color="color-mix(in oklch, var(--muted-foreground) 25%, transparent)"
            gap={20}
            size={1}
          />
          <Controls showInteractive={false} />
        </ReactFlow>
      ) : (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ fontSize: 12, color: "var(--muted-foreground)" }}>
            Loading...
          </span>
        </div>
      )}
    </div>
  );
}
