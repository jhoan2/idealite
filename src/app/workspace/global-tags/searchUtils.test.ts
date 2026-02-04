
import { describe, it, expect } from "vitest";
import { findPathToNode, getVisibleTree, getDefaultExpandedIds } from "./searchUtils";
import { TagNode } from "./tagUtils";
import { SelectTag } from "~/server/queries/tag";

// Helper to create a mock node
const createNode = (id: string, children: TagNode[] = [], isInBoth = false): TagNode => ({
  id,
  name: `Tag ${id}`,
  parent_id: null,
  created_at: new Date(),
  updated_at: new Date(),
  deleted_at: null,
  color: null,
  children,
  isInBoth
});

describe("searchUtils", () => {
  const tree = [
    createNode("root", [
      createNode("child1", [
        createNode("grandchild1"),
        createNode("grandchild2", [], true) // Owned
      ]),
      createNode("child2")
    ])
  ];

  describe("findPathToNode", () => {
    it("should find path to a nested node", () => {
      const path = findPathToNode(tree, "grandchild1");
      expect(path).toEqual(["root", "child1", "grandchild1"]);
    });

    it("should return null if node not found", () => {
      const path = findPathToNode(tree, "non-existent");
      expect(path).toBeNull();
    });

    it("should find path to root", () => {
      const path = findPathToNode(tree, "root");
      expect(path).toEqual(["root"]);
    });
  });

  describe("getVisibleTree", () => {
    it("should only show root if nothing expanded", () => {
      const visible = getVisibleTree(tree, new Set());
      expect(visible).toHaveLength(1);
      expect(visible[0].children).toHaveLength(0); // Children hidden
    });

    it("should show children if root expanded", () => {
      const visible = getVisibleTree(tree, new Set(["root"]));
      expect(visible[0].children).toHaveLength(2);
      expect(visible[0].children[0].children).toHaveLength(0); // Grandchildren hidden
    });

    it("should show grandchildren if parent expanded", () => {
      const visible = getVisibleTree(tree, new Set(["root", "child1"]));
      expect(visible[0].children[0].children).toHaveLength(2);
    });
  });

  describe("getDefaultExpandedIds", () => {
    it("should auto-expand paths to owned nodes", () => {
      const expanded = getDefaultExpandedIds(tree);
      
      expect(expanded.has("root")).toBe(true);
      expect(expanded.has("child1")).toBe(true);
      expect(expanded.has("grandchild2")).toBe(true); // The owned node
      
      // child2 path shouldn't necessarily be expanded unless logic dictates (here it's just root)
      // but root is expanded, so child2 is visible.
    });
  });
});
