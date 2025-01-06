"use client";
import { useState, useMemo } from "react";
import { SelectTag } from "~/server/queries/tag";
import { buildUserTagTree } from "../explore/(ExploreTagTree)/buildUserTagTree";
import { updateUserTags } from "~/server/actions/usersTags";
import { toast } from "sonner";
import ChannelTagTree from "./ChannelTagTree";

interface ExploreStateProps {
  tag: SelectTag[];
  userTags: SelectTag[];
  userId: string | null;
  status: string;
}

interface TagNode extends SelectTag {
  children: TagNode[];
  isInBoth: boolean;
}

export default function ChannelFrameTags({
  tag,
  userTags,
  userId,
  status,
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

  async function handleUpdateUserTags(
    userId: string,
    addedTags: SelectTag[],
    removedTags: SelectTag[],
  ) {
    const result = await updateUserTags({ userId, addedTags, removedTags });
    if (!result.success) {
      throw new Error(result.error || "Failed to update user tags");
    }
    return result;
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
    if (status !== "authenticated") return;
    setIsSaving(true);
    try {
      await handleUpdateUserTags(userId, newlyAddedTags, removedTags);
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

  return (
    <div>
      <ChannelTagTree
        tagTree={tagTree}
        flatUserTags={flatUserTags}
        setFlatUserTags={setFlatUserTags}
        hasChanged={hasChanged}
        handleSaveChanges={handleSaveChanges}
        isSaving={isSaving}
        status={status}
      />
    </div>
  );
}
