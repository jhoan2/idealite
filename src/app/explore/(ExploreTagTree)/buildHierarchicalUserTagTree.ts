import { SelectTag } from "~/server/usersTagsQueries";

// Define the type for the output tree node
type TreeNode = {
  id: string;
  name: string;
  children: TreeNode[];
};

// Function to build the hierarchical tree
export function buildHierarchicalTree(nodes: SelectTag[]): TreeNode[] {
  const nodeMap = new Map<string, TreeNode>();

  // Create a map of all nodes
  nodes.forEach((node) => {
    nodeMap.set(node.id, { id: node.id, name: node.name, children: [] });
  });

  const rootNodes: TreeNode[] = [];

  // Build the tree structure
  nodes.forEach((node) => {
    if (node.parent_id === null) {
      rootNodes.push(nodeMap.get(node.id)!);
    } else {
      const parentNode = nodeMap.get(node.parent_id);
      if (parentNode) {
        parentNode.children.push(nodeMap.get(node.id)!);
      }
    }
  });

  return rootNodes;
}
