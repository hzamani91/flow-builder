'use client';
import React, { useState } from 'react';
import ReactFlow, {
  addEdge,
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
} from 'react-flow-renderer';
import { CustomNode } from '@/components/nodes';
import '@/components/nodes/nodes.css';

// Initial node types
const nodeTypes = {
  http: {
    label: 'HTTP Request',
    color: '#6ede87',
    inputs: ['url', 'method', 'headers', 'body'],
    outputs: ['response', 'error'],
  },
  delay: {
    label: 'Delay',
    color: '#7d7d7d',
    inputs: ['duration'],
    outputs: ['complete'],
  },
};

const nodeTypesMap = {
  http: CustomNode,
  delay: CustomNode,
};

export default function WorkflowEditor() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const addNode = (type: keyof typeof nodeTypes) => {
    const id = `${type}-${Date.now()}`;
    const newNode: Node = {
      id,
      type,
      data: {
        label: nodeTypes[type].label,
        inputs: nodeTypes[type].inputs,
        outputs: nodeTypes[type].outputs,
      },
      position: {
        x: Math.random() * 400,
        y: Math.random() * 400,
      },
    };
    setNodes((prev) => [...prev, newNode]);
  };

  const onConnect = (params: any) => {
    setEdges((prev) => addEdge(params, prev));
  };

  return (
    <ReactFlowProvider>
      <div className='workflow-editor'>
        <div className='toolbar'>
          <button onClick={() => addNode('http')}>Add HTTP Node</button>
          <button onClick={() => addNode('delay')}>Add Delay Node</button>
        </div>
        <ReactFlow 
          nodes={nodes} 
          edges={edges} 
          onNodesChange={onNodesChange} 
          onEdgesChange={onEdgesChange} 
          onConnect={onConnect}
          nodeTypes={nodeTypesMap}
          fitView
          style={{ height: '100vh' }}
        >
          <Background />
          <Controls />
        </ReactFlow>
      </div>
    </ReactFlowProvider>
  );
}
