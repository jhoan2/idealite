
import dagre from 'dagre';
import { Node, Edge, Position } from 'reactflow';
import { TagNode } from './tagUtils';

const NODE_WIDTH = 250;
const NODE_HEIGHT = 100;

const PALETTE = [
  "#FAAC7D", "#FAC552", "#FAAF53", "#FA7452", "#EBD050",
  "#EB7450", "#EAAA50", "#EBBD50", "#EB8F50", "#EBCB9E",
  "#EB6554", "#EB9954", "#EB7F55", "#EBB154", "#EB6A2F",
];

export const getLayoutedElements = (
  rootNodes: TagNode[],
  direction = 'LR'
) => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  const isHorizontal = direction === 'LR';
  dagreGraph.setGraph({ 
    rankdir: direction,
    ranksep: 150, // Horizontal gap between layers
    nodesep: 60   // Vertical gap between nodes
  });

  const initialNodes: Node[] = [];
  const initialEdges: Edge[] = [];

  const traverse = (node: TagNode, level: number, inheritedColor?: string) => {
    // Determine color:
    // 1. If explicit color exists (from DB), use it.
    // 2. Else use inherited color.
    // 3. Fallback to default orange if neither.
    const displayColor = node.color || inheritedColor || "#f97316";

    initialNodes.push({
      id: node.id,
      type: 'tagNode',
      data: { 
        label: node.name, 
        isInBoth: node.isInBoth,
        id: node.id, 
        color: displayColor,
        level: level
      },
      position: { x: 0, y: 0 },
    });

    if (node.children) {
      node.children.forEach((child) => {
        const isChildOwned = child.isInBoth;
        
        initialEdges.push({
          id: `${node.id}-${child.id}`,
          source: node.id,
          target: child.id,
          type: 'smoothstep',
          animated: false,
          style: { 
            stroke: isChildOwned ? displayColor : '#94a3b8', // Color match parent if owned, else gray
            strokeWidth: isChildOwned ? 2 : 1,
            strokeDasharray: isChildOwned ? undefined : '5,5', // Dashed if not owned
            opacity: isChildOwned ? 0.8 : 0.5
          }
        });
        
        // Pass the current color down to children
        traverse(child, level + 1, displayColor);
      });
    }
  };

  // Logic to seed the colors at the top level (or 2nd level if single root)
  if (rootNodes.length === 1) {
    const root = rootNodes[0];
    
    // Process root
    initialNodes.push({
      id: root.id,
      type: 'tagNode',
      data: { 
        label: root.name, 
        isInBoth: root.isInBoth, 
        id: root.id,
        color: root.color || "#FAAC7D",
        level: 0
      },
      position: { x: 0, y: 0 }
    });

    // Process children of root, assigning them distinct palette colors
    if (root.children) {
      root.children.forEach((child, index) => {
        const paletteColor = PALETTE[index % PALETTE.length];
        
        const isChildOwned = child.isInBoth;
        
        initialEdges.push({
            id: `${root.id}-${child.id}`,
            source: root.id,
            target: child.id,
            type: 'smoothstep',
            animated: false,
             style: { 
                stroke: isChildOwned ? paletteColor : '#94a3b8',
                strokeWidth: isChildOwned ? 2 : 1,
                strokeDasharray: isChildOwned ? undefined : '5,5',
                opacity: isChildOwned ? 0.8 : 0.5
            }
        });

        traverse(child, 1, paletteColor);
      });
    }

  } else {
    // Multiple roots - assign palette to them directly
    rootNodes.forEach((node, index) => {
      const paletteColor = PALETTE[index % PALETTE.length];
      traverse(node, 0, paletteColor);
    });
  }


  initialNodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  initialEdges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = initialNodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    
    return {
      ...node,
      targetPosition: isHorizontal ? Position.Left : Position.Top,
      sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
      position: {
        x: nodeWithPosition.x - NODE_WIDTH / 2,
        y: nodeWithPosition.y - NODE_HEIGHT / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges: initialEdges };
};
