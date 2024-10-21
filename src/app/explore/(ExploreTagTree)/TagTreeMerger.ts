import { v4 as uuidv4 } from "uuid";

interface TreeNodeData {
  id: string;
  name: string;
  children?: TreeNodeData[];
}

export function mergeTrees(
  tree1: TreeNodeData,
  tree2: TreeNodeData,
): TreeNodeData {
  // Create a new root node
  const mergedTree: TreeNodeData = {
    id: uuidv4(),
    name: "root",
    children: [],
  };

  // Function to recursively add nodes to the merged tree
  function addNodeToMergedTree(node: TreeNodeData, parentNode: TreeNodeData) {
    const existingNode = parentNode.children?.find(
      (child) => child.name === node.name,
    );

    if (existingNode) {
      // If a node with the same name exists, merge their children
      node.children?.forEach((childNode) => {
        addNodeToMergedTree(childNode, existingNode);
      });
    } else {
      // If no node with the same name exists, add it to the parent
      parentNode.children?.push({
        id: node.id,
        name: node.name,
        children: [],
      });

      // Recursively add children
      node.children?.forEach((childNode) => {
        addNodeToMergedTree(
          childNode,
          parentNode.children![parentNode.children!.length - 1]!,
        );
      });
    }
  }

  // Add nodes from both trees to the merged tree
  tree1.children?.forEach((node) => addNodeToMergedTree(node, mergedTree));
  tree2.children?.forEach((node) => addNodeToMergedTree(node, mergedTree));

  return mergedTree;
}
