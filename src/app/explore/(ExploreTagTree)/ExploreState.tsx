"use client";

import { useState, useMemo } from "react";
import ExploreTagTree from "./ExploreTagTree";
import CirclePack from "./CirclePack";
import { SelectTag } from "~/server/queries/tag";
import { buildUserTagTree } from "./buildUserTagTree";
import { toast } from "sonner";

interface ExploreStateProps {
  tag: SelectTag[];
  userTags: SelectTag[];
  userId: string | null;
}

interface TagNode extends SelectTag {
  children: TagNode[];
  isInBoth: boolean;
}

function createTagTree(
  rootTags: SelectTag[],
  userTags: SelectTag[],
): TagNode[] {
  const userTagSet = new Set(userTags.map((tag) => tag.id));

  function buildTree(
    tags: SelectTag[],
    parentId: string | null = null,
  ): TagNode[] {
    return tags
      .filter((tag) => tag.parent_id === parentId)
      .map((tag) => ({
        ...tag,
        children: buildTree(tags, tag.id),
        isInBoth: userTagSet.has(tag.id),
      }));
  }

  return buildTree(rootTags);
}

export default function ExploreState({
  tag,
  userTags,
  userId,
}: ExploreStateProps) {
  const [flatRootTag] = useState<SelectTag[]>(tag);
  const [flatUserTags, setFlatUserTags] = useState<SelectTag[]>(userTags);
  const [initialUserTags, setInitialUserTags] = useState<SelectTag[]>(userTags);
  const [newlyAddedTags, setNewlyAddedTags] = useState<SelectTag[]>([]);
  const [removedTags, setRemovedTags] = useState<SelectTag[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const tagTree = useMemo(
    () => createTagTree(flatRootTag, flatUserTags),
    [flatRootTag, flatUserTags],
  );

  const userTagTree = useMemo(
    () => buildUserTagTree(flatUserTags),
    [flatUserTags],
  );

  async function updateUserTags(
    userId: string,
    addedTags: SelectTag[],
    removedTags: SelectTag[],
  ) {
    try {
      const response = await fetch("/api/usersTags", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          addedTags,
          removedTags,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update user tags");
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Error updating user tags:", error);
      throw error;
    }
  }

  const hasChanged = useMemo(() => {
    const flatUserTagSet = new Set(flatUserTags.map((tag) => tag.id));
    const initialUserTagSet = new Set(initialUserTags.map((tag) => tag.id));

    const addedTags = flatUserTags.filter(
      (tag) => !initialUserTagSet.has(tag.id),
    );
    const removedTags = initialUserTags.filter(
      (tag) => !flatUserTagSet.has(tag.id),
    );

    setNewlyAddedTags(addedTags);
    setRemovedTags(removedTags);

    return addedTags.length > 0 || removedTags.length > 0;
  }, [flatUserTags, initialUserTags]);

  const handleSaveChanges = async () => {
    if (!hasChanged) return;
    if (!userId) return;
    setIsSaving(true);
    try {
      await updateUserTags(userId, newlyAddedTags, removedTags);
      setInitialUserTags([...flatUserTags]);
      setNewlyAddedTags([]);
      setRemovedTags([]);
    } catch (error) {
      console.error("Failed to save changes:", error);
      toast.error("Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex">
      <ExploreTagTree
        tagTree={userTagTree}
        flatUserTags={flatUserTags}
        setFlatUserTags={setFlatUserTags}
        hasChanged={hasChanged}
        handleSaveChanges={handleSaveChanges}
        isSaving={isSaving}
      />
      <div className="flex-1">
        <CirclePack
          tagTree={tagTree[0]}
          flatUserTags={flatUserTags}
          setFlatUserTags={setFlatUserTags}
        />
      </div>
    </div>
  );
}
