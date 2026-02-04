import { Node, Edge } from 'reactflow';
import { TagNode } from './tagUtils';

const CENTER_X = 0;
const CENTER_Y = 0;
const RING_SPACING = 350; // Distance between concentric rings
const NODE_WIDTH = 250;
const NODE_HEIGHT = 100;

const PALETTE = [
  "#FAAC7D", "#FAC552", "#FAAF53", "#FA7452", "#EBD050",
  "#EB7450", "#EAAA50", "#EBBD50", "#EB8F50", "#EBCB9E",
  "#EB6554", "#EB9954", "#EB7F55", "#EBB154", "#EB6A2F",
];

/**
 * Radial (Hub-and-Spoke) Layout Algorithm
 *
 * - Level 0 (root) is at the center
 * - Level 1 nodes form a circle around the center
 * - Level 2+ nodes radiate outward in concentric rings
 * - Children are clustered in a wedge near their parent
 *
 * Each node gets an angular range (startAngle → endAngle).
 * Children share their parent's angular range, divided equally among them.
 * Nodes are positioned at the midpoint of their angular range.
 */
export const getLayoutedElements = (
  rootNodes: TagNode[],
  _direction = 'LR' // Kept for API compatibility, but ignored in radial layout
) => {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  /**
   * Recursive traversal that positions nodes in a radial layout.
   *
   * @param tagNode - The current tag node to process
   * @param level - Depth in the tree (0 = root)
   * @param startAngle - Start of this node's angular range (radians)
   * @param endAngle - End of this node's angular range (radians)
   * @param inheritedColor - Color inherited from parent
   */
  const traverse = (
    tagNode: TagNode,
    level: number,
    startAngle: number,
    endAngle: number,
    inheritedColor?: string
  ) => {
    const midAngle = (startAngle + endAngle) / 2;
    const radius = level * RING_SPACING;

    // Calculate position - root at center, others on their ring
    const x = level === 0
      ? CENTER_X
      : CENTER_X + radius * Math.cos(midAngle);
    const y = level === 0
      ? CENTER_Y
      : CENTER_Y + radius * Math.sin(midAngle);

    // Determine display color (explicit > inherited > default)
    const displayColor = tagNode.color || inheritedColor || "#f97316";

    nodes.push({
      id: tagNode.id,
      type: 'tagNode',
      data: {
        label: tagNode.name,
        isInBoth: tagNode.isInBoth,
        id: tagNode.id,
        color: displayColor,
        level: level,
        angle: midAngle, // Store angle for potential edge positioning
      },
      position: { x: x - NODE_WIDTH / 2, y: y - NODE_HEIGHT / 2 },
    });

    // Process children - divide parent's angular range among them
    if (tagNode.children && tagNode.children.length > 0) {
      const childCount = tagNode.children.length;
      const anglePerChild = (endAngle - startAngle) / childCount;

      tagNode.children.forEach((child, index) => {
        const childStart = startAngle + index * anglePerChild;
        const childEnd = childStart + anglePerChild;
        const isChildOwned = child.isInBoth;

        edges.push({
          id: `${tagNode.id}-${child.id}`,
          source: tagNode.id,
          target: child.id,
          type: 'straight', // Straight edges work better for radial layout
          animated: false,
          style: {
            stroke: isChildOwned ? displayColor : '#94a3b8',
            strokeWidth: isChildOwned ? 2 : 1,
            strokeDasharray: isChildOwned ? undefined : '5,5',
            opacity: isChildOwned ? 0.8 : 0.5
          }
        });

        traverse(child, level + 1, childStart, childEnd, displayColor);
      });
    }
  };

  // Start traversal based on number of roots
  if (rootNodes.length === 1) {
    const root = rootNodes[0];

    // Single root: place at center, give it full circle (0 to 2π)
    nodes.push({
      id: root.id,
      type: 'tagNode',
      data: {
        label: root.name,
        isInBoth: root.isInBoth,
        id: root.id,
        color: root.color || "#FAAC7D",
        level: 0,
        angle: 0,
      },
      position: { x: CENTER_X - NODE_WIDTH / 2, y: CENTER_Y - NODE_HEIGHT / 2 }
    });

    // Process children of root with distinct palette colors
    if (root.children && root.children.length > 0) {
      const childCount = root.children.length;
      const anglePerChild = (2 * Math.PI) / childCount;

      root.children.forEach((child, index) => {
        const childStart = index * anglePerChild;
        const childEnd = (index + 1) * anglePerChild;
        const paletteColor = PALETTE[index % PALETTE.length];
        const isChildOwned = child.isInBoth;

        edges.push({
          id: `${root.id}-${child.id}`,
          source: root.id,
          target: child.id,
          type: 'straight',
          animated: false,
          style: {
            stroke: isChildOwned ? paletteColor : '#94a3b8',
            strokeWidth: isChildOwned ? 2 : 1,
            strokeDasharray: isChildOwned ? undefined : '5,5',
            opacity: isChildOwned ? 0.8 : 0.5
          }
        });

        traverse(child, 1, childStart, childEnd, paletteColor);
      });
    }
  } else {
    // Multiple roots: divide circle among them, each gets a sector
    const anglePerRoot = (2 * Math.PI) / rootNodes.length;

    rootNodes.forEach((root, index) => {
      const rootStart = index * anglePerRoot;
      const rootEnd = (index + 1) * anglePerRoot;
      const paletteColor = PALETTE[index % PALETTE.length];

      traverse(root, 0, rootStart, rootEnd, paletteColor);
    });
  }

  return { nodes, edges };
};
