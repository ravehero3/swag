import React, { memo } from "react";
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  type Node,
  type Edge,
  type NodeChange,
  type EdgeChange,
} from "reactflow";
import "reactflow/dist/style.css";

// Custom node component with left border accent and rounded corners
const CustomNode = memo(({ data }: { data: { label: string; color: string } }) => {
  const borderColor = data.color === "yellow" ? "#facc15" : "#14b8a6"; // Tailwind yellow-400, teal-500
  return (
    <div
      style={{
        padding: "12px 12px",
        borderRadius: "8px",
        background: "#1e1e1e",
        borderLeft: `6px solid ${borderColor}`,
        color: "#e0e0e0",
        fontSize: "14px",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        minWidth: "220px",
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill={borderColor}>
        <circle cx="12" cy="12" r="10" />
      </svg>
      {data.label}
    </div>
  );
});

export const nodeTypes = { custom: CustomNode };

export default function EmailJourneyBuilder() {
  // Vertical layout: same X coordinate for all nodes
  const initialNodes: Node[] = [
    {
      id: "trigger",
      type: "custom",
      data: { label: "Contact signs up for email", color: "yellow" },
      position: { x: 250, y: 0 },
    },
    {
      id: "action",
      type: "custom",
      data: { label: "Send email: Welcome email", color: "teal" },
      position: { x: 250, y: 180 },
    },
    {
      id: "endpoint",
      type: "custom",
      data: { label: "Contact Exits", color: "gray" },
      position: { x: 250, y: 360 },
      style: { width: 30, height: 30 },
    },
  ];

  const initialEdges: Edge[] = [
    { id: "e1", source: "trigger", target: "action", type: "default", animated: false },
    { id: "e2", source: "action", target: "endpoint", type: "default", animated: false },
  ];

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  return (
    <div style={{ width: "100%", height: "100%", background: "#222", color: "#eee", overflow: "hidden" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        zoomOnScroll={true}
        zoomOnPinch={true}
        panOnScroll={true}
        translateExtent={[[ -1e6, -1e6 ], [ 1e6, 1e6 ]]}
        minZoom={0.2}
        maxZoom={2}
        snapToGrid={false}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background variant="dots" gap={12} size={1} color="#444" />
        <Controls showZoom={true} />
      </ReactFlow>
    </div>
  );
}
