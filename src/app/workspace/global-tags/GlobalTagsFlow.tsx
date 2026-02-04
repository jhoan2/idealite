
"use client";

import { useCallback, useEffect } from 'react';
import ReactFlow, {
  useNodesState,
  useEdgesState,
  ConnectionLineType,
  Background,
  Controls,
  Node,
  useReactFlow,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { toast } from "sonner";
import { addUserTag } from "~/server/actions/usersTags";
import { TagNode } from './tagUtils';
import { getLayoutedElements } from './flowUtils';
import GlobalTagNode from './GlobalTagNode';
import { TagSearch } from './TagSearch';

const nodeTypes = {
  tagNode: GlobalTagNode,
};

interface GlobalTagsFlowProps {
  tagTree: TagNode[];
  isMobile?: boolean;
}

const sendHapticFeedback = (type: "impact" | "selection") => {
  if (typeof window !== "undefined" && (window as any).ReactNativeWebView) {
    (window as any).ReactNativeWebView.postMessage(
      JSON.stringify({
        type: type === "impact" ? "HAPTIC_IMPACT" : "HAPTIC_SELECTION",
      }),
    );
  }
};

function GlobalTagsFlowInner({ tagTree, isMobile }: GlobalTagsFlowProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { fitView, setCenter, getNode } = useReactFlow();

  // Helper to apply semantic zoom visibility
  const applySemanticZoom = useCallback((currentNodes: Node[], zoom: number) => {
    const ZOOM_THRESHOLD = 0.6;
    
    return currentNodes.map(node => {
      // Level 2+ nodes (Topics) are hidden when zoomed out
      const shouldHide = (node.data.level >= 2) && (zoom < ZOOM_THRESHOLD);
      
      if (node.hidden !== shouldHide) {
        return { ...node, hidden: shouldHide };
      }
      return node;
    });
  }, []);

  useEffect(() => {
    // If tagTree is valid, compute layout
    if (tagTree && tagTree.length > 0) {
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
        tagTree,
        'LR' // Switch to Left-Right layout
      );

      // Initial state: hide deep levels for cleaner load
      const initialNodes = applySemanticZoom(layoutedNodes, 0.5);

      setNodes(initialNodes);
      setEdges(layoutedEdges);

      // Short delay to allow rendering before fitting
      setTimeout(() => {
        fitView({ padding: 0.2, duration: 800 });
      }, 50);
    }
  }, [tagTree, fitView, setNodes, setEdges, applySemanticZoom]);

  const onMoveEnd = useCallback((event: any, viewport: any) => {
    setNodes((nds) => applySemanticZoom(nds, viewport.zoom));
  }, [setNodes, applySemanticZoom]);

  const onSearchSelect = useCallback((tagId: string) => {
    const node = getNode(tagId);
    if (node) {
        // Fly to the node
        const TARGET_ZOOM = 1.2;
        // Center on the node (offset by half width/height roughly)
        setCenter(node.position.x + 125, node.position.y + 50, { zoom: TARGET_ZOOM, duration: 1000 });
        
        // Update nodes: Select the target AND apply semantic zoom immediately for the target zoom level
        // This ensures the node is visible even before the animation finishes
        setNodes(nds => {
            const nodesWithSelection = nds.map(n => ({
                ...n,
                selected: n.id === tagId
            }));
            return applySemanticZoom(nodesWithSelection, TARGET_ZOOM);
        });
    } else {
        toast.error("Tag not found in current view");
    }
  }, [getNode, setCenter, setNodes, applySemanticZoom]);

  const onNodeClick = useCallback(async (event: React.MouseEvent, node: Node) => {
    // Mobile haptic feedback
    if (isMobile) {
      sendHapticFeedback("impact");
    }

    // Prevent interaction if already owned
    if (node.data.isInBoth) {
      return;
    }

    try {
      // Optimistic update
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id === node.id) {
            return {
              ...n,
              data: { ...n.data, isInBoth: true },
            };
          }
          return n;
        })
      );

      // Server action
      const result = await addUserTag(node.id);

      if (result.success) {
        toast.success(`Added tag "${node.data.label}"`);
        
        // Dispatch event for Tour and Mobile handling
        if (typeof window !== "undefined") {
           const eventDetail = {
              tagId: node.id,
              tagName: node.data.label,
              type: "TAG_ADDED_SUCCESS"
           };

           // Web Tour event
           window.dispatchEvent(
            new CustomEvent("tag-added", { detail: eventDetail })
           );

           // Mobile WebView message
           if ((window as any).ReactNativeWebView) {
             (window as any).ReactNativeWebView.postMessage(
               JSON.stringify(eventDetail)
             );
           }
        }
      } else {
        throw new Error(result.error || 'Failed to add tag');
      }

    } catch (error) {
      console.error(error);
      toast.error('Failed to add tag');
      
      // Revert optimistic update on error
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id === node.id) {
            return {
              ...n,
              data: { ...n.data, isInBoth: false },
            };
          }
          return n;
        })
      );
      
      // Send error to mobile
      if (typeof window !== "undefined" && (window as any).ReactNativeWebView) {
          (window as any).ReactNativeWebView.postMessage(
            JSON.stringify({
              type: "TAG_ADD_ERROR",
              error: "Failed to add tag"
            })
          );
      }
    }
  }, [setNodes, isMobile]);

  return (
    <div className="h-full w-full bg-slate-50 dark:bg-slate-950/50">
      {!isMobile && <TagSearch tagTree={tagTree} onSelectTag={onSearchSelect} />}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onMoveEnd={onMoveEnd}
        nodeTypes={nodeTypes}
        connectionLineType={ConnectionLineType.SmoothStep}
        fitView
        minZoom={0.1}
        maxZoom={1.5}
        defaultEdgeOptions={{ type: 'smoothstep', animated: false }}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={20} size={1} color="#94a3b8" className="opacity-20" />
        {!isMobile && <Controls showInteractive={false} />}
      </ReactFlow>
    </div>
  );
}

export default function GlobalTagsFlow(props: GlobalTagsFlowProps) {
  return (
    <ReactFlowProvider>
      <GlobalTagsFlowInner {...props} />
    </ReactFlowProvider>
  );
}
