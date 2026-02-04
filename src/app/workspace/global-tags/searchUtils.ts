import { TagNode } from './tagUtils';

/**
 * Flattens the tree into a single array of nodes for searching.
 */
export function flattenTree(nodes: TagNode[]): TagNode[] {
  let flat: TagNode[] = [];
  
  nodes.forEach(node => {
    flat.push(node);
    if (node.children) {
      flat = flat.concat(flattenTree(node.children));
    }
  });
  
  return flat;
}

/**
 * Finds the path of node IDs from the root to the target node.
 * Used to auto-expand the tree when a user selects a search result.
 */
export function findPathToNode(nodes: TagNode[], targetId: string, currentPath: string[] = []): string[] | null {
  for (const node of nodes) {
    const path = [...currentPath, node.id];
    
    if (node.id === targetId) {
      return path;
    }
    
    if (node.children) {
      const result = findPathToNode(node.children, targetId, path);
      if (result) {
        return result;
      }
    }
  }
  
  return null;
}

/**
 * Filters the tree to return only the visible nodes based on expanded state.
 * - Root nodes are always visible.
 * - Children are visible ONLY if their parent is expanded.
 */
export function getVisibleTree(nodes: TagNode[], expandedIds: Set<string>): TagNode[] {
  return nodes.map(node => {
    // If this node is NOT expanded, we strip its children (effectively hiding them)
    // But we still return the node itself so it can be rendered
    if (!expandedIds.has(node.id)) {
      return { ...node, children: [] }; 
    }

    // If it IS expanded, we recurse to process its children
    return {
      ...node,
      children: getVisibleTree(node.children, expandedIds)
    };
  });
}

/**
 * returns a set of IDs that should be expanded by default.
 * E.g., all nodes that have "isInBoth: true" (owned by user) and their parents.
 */
export function getDefaultExpandedIds(nodes: TagNode[]): Set<string> {
  const expanded = new Set<string>();
  const flat = flattenTree(nodes);
  
  // Find all owned nodes
  const ownedNodes = flat.filter(n => n.isInBoth);
  
  // For each owned node, find its path and add to expanded
  ownedNodes.forEach(node => {
    const path = findPathToNode(nodes, node.id);
    if (path) {
      // Add all IDs in the path
      path.forEach(id => expanded.add(id));
    }
  });
  
  // Always expand root nodes (top level)
  nodes.forEach(n => expanded.add(n.id));

  return expanded;
}
