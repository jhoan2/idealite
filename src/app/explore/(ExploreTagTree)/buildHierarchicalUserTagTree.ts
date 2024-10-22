import { SelectTag } from "~/server/usersTagsQueries";

export type TreeNode = {
  id: string;
  name: string;
  children: TreeNode[];
  parent_id: string | null;
};

export type RootNode = {
  id: string;
  name: string;
  children: TreeNode[];
  parent_id: string | null;
};

export function buildHierarchicalTree(nodes: SelectTag[]): TreeNode[] {
  // Early return if no nodes
  if (!nodes || nodes.length === 0) {
    return [
      {
        id: "tags",
        name: "tags",
        children: [],
        parent_id: null,
      },
    ];
  }

  const nodeMap = new Map<string, TreeNode>();

  nodes.forEach((node) => {
    nodeMap.set(node.id, {
      id: node.id,
      name: node.name,
      children: [],
      parent_id: node.parent_id,
    });
  });

  const rootNodes: TreeNode[] = [];

  // Build the tree structure
  nodes.forEach((node) => {
    const currentNode = nodeMap.get(node.id);

    if (!currentNode) return; // Skip if node not found

    if (node.parent_id === null) {
      // This is a root node
      rootNodes.push(currentNode);
    } else {
      // This is a child node
      const parentNode = nodeMap.get(node.parent_id);
      if (parentNode) {
        // Only add if we haven't already added this child
        if (!parentNode.children.some((child) => child.id === currentNode.id)) {
          parentNode.children.push(currentNode);
        }
      } else {
        // If parent not found, treat as root node
        rootNodes.push(currentNode);
      }
    }
  });

  // If no root nodes were found (single node case), add the node as root
  if (rootNodes.length === 0 && nodes.length > 0) {
    const firstNode = nodes[0];
    if (firstNode) {
      const singleNode = nodeMap.get(firstNode.id);
      if (singleNode) {
        rootNodes.push(singleNode);
      }
    }
  }

  const rootNode: RootNode = {
    id: "tags",
    name: "tags",
    children: rootNodes,
    parent_id: null,
  };

  return [rootNode];
}
