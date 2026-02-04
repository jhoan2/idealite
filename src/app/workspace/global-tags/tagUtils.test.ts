
import { describe, it, expect } from "vitest";
import { createTagTree, TagNode } from "./tagUtils";
import { SelectTag } from "~/server/queries/tag";

// Mock data helpers
const createTag = (id: string, parent_id: string | null = null, name: string = "tag"): SelectTag => ({
  id,
  parent_id,
  name,
  created_at: new Date(),
  updated_at: new Date(),
  deleted_at: null,
  color: null,
});

describe("createTagTree", () => {
  it("should build a simple hierarchy", () => {
    const rootTags = [
      createTag("1", null, "Root"),
      createTag("2", "1", "Child 1"),
      createTag("3", "1", "Child 2"),
    ];
    const userTags: SelectTag[] = [];

    const tree = createTagTree(rootTags, userTags);

    expect(tree).toHaveLength(1);
    expect(tree[0].id).toBe("1");
    expect(tree[0].children).toHaveLength(2);
    expect(tree[0].children.map(c => c.id).sort()).toEqual(["2", "3"]);
  });

  it("should handle deep nesting", () => {
    const rootTags = [
      createTag("1", null, "Root"),
      createTag("2", "1", "Level 1"),
      createTag("3", "2", "Level 2"),
    ];
    const userTags: SelectTag[] = [];

    const tree = createTagTree(rootTags, userTags);

    expect(tree[0].children[0].id).toBe("2");
    expect(tree[0].children[0].children[0].id).toBe("3");
  });

  it("should correctly mark tags as owned (isInBoth)", () => {
    const rootTags = [
      createTag("1", null, "Root"),
      createTag("2", "1", "Child"),
    ];
    // User owns the child tag ("2") but not the root
    const userTags = [createTag("2", "1", "Child")];

    const tree = createTagTree(rootTags, userTags);

    expect(tree[0].isInBoth).toBe(false); // Root not owned
    expect(tree[0].children[0].isInBoth).toBe(true); // Child owned
  });

  it("should handle empty inputs", () => {
    expect(createTagTree([], [])).toEqual([]);
  });

  it("should handle orphaned tags (tags with parent_id not in list) gracefully", () => {
    // If a tag has a parent_id but the parent isn't in the list, it won't appear in the tree
    // because the recursion starts from parent_id: null. 
    // This assumes the root of the visualization is always a null-parent tag (or specific ID passed to recursion).
    // Note: The current implementation looks for parent_id === null to start.
    
    const rootTags = [
      createTag("2", "1", "Orphan"), // Parent "1" doesn't exist in list
    ];
    const userTags: SelectTag[] = [];

    const tree = createTagTree(rootTags, userTags);
    expect(tree).toHaveLength(0);
  });
});
