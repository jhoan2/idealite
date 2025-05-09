import { useState } from "react";
import { stopEventPropagation, Tldraw } from "tldraw";
import "tldraw/tldraw.css";
import { hierarchy, pack } from "d3-hierarchy";
import { scaleOrdinal } from "d3-scale";
import { toast } from "sonner";
import { addUserTag } from "~/server/actions/usersTags";
interface TreeNodeData {
  id: string;
  name: string;
  children?: TreeNodeData[];
  isInBoth?: boolean;
}

interface CirclePackProps {
  width?: number;
  height?: number;
  tagTree: TreeNodeData | undefined;
}

function CirclePack({ width = 600, height = 600, tagTree }: CirclePackProps) {
  const data: TreeNodeData = tagTree || {
    id: "root",
    name: "Root",
    children: [],
  };

  const colors = [
    "#FAAC7D",
    "#FAC552",
    "#FAAF53",
    "#FA7452",
    "#EBD050",
    "#EB7450",
    "#EAAA50",
    "#EBBD50",
    "#EB8F50",
    "#EBCB9E",
    "#EB6554",
    "#EB9954",
    "#EB7F55",
    "#EBB154",
    "#EB6A2F",
  ];

  const polarToCartesian = (
    centerX: number,
    centerY: number,
    radius: number,
    angleInDegrees: number,
  ) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    };
  };

  const describeArc = (
    x: number,
    y: number,
    radius: number,
    startAngle: number,
    endAngle: number,
  ) => {
    const start = polarToCartesian(x, y, radius, startAngle);
    const end = polarToCartesian(x, y, radius, endAngle);
    const arcLength = endAngle - startAngle;
    const longArc = arcLength >= 180 ? 1 : 0;
    const d = [
      "M",
      start.x,
      start.y,
      "A",
      radius,
      radius,
      0,
      longArc,
      1,
      end.x,
      end.y,
    ].join(" ");
    return d;
  };

  // Use imported hierarchy function instead of d3.hierarchy
  const hierarchyData = hierarchy(data)
    .sum(() => 1)
    .sort((a, b) => b.value! - a.value!);

  // Use imported pack function instead of d3.pack
  const packGenerator = pack<TreeNodeData>().size([width, height]).padding(15);

  const root = packGenerator(hierarchyData);

  const handleCircleClick = async (
    event: React.MouseEvent,
    node: d3.HierarchyCircularNode<TreeNodeData>,
  ) => {
    event.stopPropagation();

    try {
      const result = await addUserTag(node.data.id);

      if (result.success) {
        // Dispatch custom event when tag is successfully added
        window.dispatchEvent(
          new CustomEvent("tag-added", {
            detail: {
              tagId: node.data.id,
              tagName: node.data.name,
            },
          }),
        );
      }
    } catch (error) {
      console.error("Failed to add tag:", error);
      toast.error("Failed to add tag");
    }
  };

  const firstLevelGroups = hierarchyData?.children?.map(
    (child) => child.data.name,
  );
  const colorScale = scaleOrdinal<string>()
    .domain(firstLevelGroups || [])
    .range(colors);

  const renderCircles = (nodes: d3.HierarchyCircularNode<TreeNodeData>[]) => {
    return nodes.map((node) => {
      const parentName = node.data.name;
      const arcText = describeArc(node.x, node.y, node.r - 10, -10, 270);

      return (
        <g
          key={node.data.name}
          onClick={
            node.data.isInBoth
              ? undefined
              : (event) => handleCircleClick(event, node)
          }
          onPointerDown={stopEventPropagation}
        >
          <circle
            cx={node.x}
            cy={node.y}
            r={node.r}
            stroke={colorScale(parentName)}
            strokeWidth={1}
            strokeOpacity={0.3}
            fill={colorScale(parentName)}
            fillOpacity={node.data.isInBoth ? 0.8 : 0.1}
            className={
              node.data.isInBoth
                ? ""
                : "transition-colors duration-200 hover:fill-slate-400"
            }
          />
          <path id={node.data.name} fill="none" d={arcText} />
          <text fontSize={12} fontWeight={0.4}>
            <textPath href={`#${node.data.name}`}>{node.data.name}</textPath>
          </text>
        </g>
      );
    });
  };

  const getNodesAtDepth = (depth: number) => {
    return root.descendants().filter((node) => node.depth === depth);
  };

  const maxDepth = Math.max(...root.descendants().map((node) => node.depth));
  const allCircles = Array.from({ length: maxDepth + 1 }, (_, i) =>
    renderCircles(getNodesAtDepth(i)),
  );

  return (
    <div className="relative">
      <h1>Select Tags</h1>
      <svg width={width} height={height} style={{ display: "inline-block" }}>
        {allCircles}
      </svg>
    </div>
  );
}

function MyComponentInFront() {
  const [state, setState] = useState(0);

  return (
    <>
      <div
        style={{
          position: "absolute",
          top: 50,
          left: 50,
          width: 200,
          padding: 12,
          borderRadius: 8,
          backgroundColor: "goldenrod",
          zIndex: 0,
          userSelect: "unset",
          boxShadow: "0 0 0 1px rgba(0,0,0,0.1), 0 4px 8px rgba(0,0,0,0.1)",
        }}
        onPointerDown={stopEventPropagation}
        onPointerMove={stopEventPropagation}
      >
        <p>The count is {state}! </p>
        <button onClick={() => setState((s) => s - 1)}>-1</button>
        <p>
          These components are on the canvas. They will scale with camera zoom
          like shapes.
        </p>
      </div>
      <div
        style={{
          position: "absolute",
          top: 210,
          left: 150,
          width: 200,
          padding: 12,
          borderRadius: 8,
          backgroundColor: "pink",
          zIndex: 99999999,
          userSelect: "unset",
          boxShadow: "0 0 0 1px rgba(0,0,0,0.1), 0 4px 8px rgba(0,0,0,0.1)",
        }}
        onPointerDown={stopEventPropagation}
        onPointerMove={stopEventPropagation}
      >
        <p>The count is {state}! </p>
        <button onClick={() => setState((s) => s + 1)}>+1</button>
        <p>
          Create and select a shape to see the in front of the canvas component
        </p>
      </div>
    </>
  );
}

export default function OnTheCanvasExample({
  tagTree,
}: {
  tagTree: TreeNodeData | undefined;
}) {
  const components = {
    OnTheCanvas: (props: any) => <CirclePack {...props} tagTree={tagTree} />,
    // InFrontOfTheCanvas: MyComponentInFront,
  };

  return (
    <div className="tldraw__editor h-full">
      <Tldraw
        persistenceKey="things-on-the-canvas-example"
        components={components}
        hideUi={true}
      />
    </div>
  );
}
