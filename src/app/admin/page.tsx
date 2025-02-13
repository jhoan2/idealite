"use client";

import { useState } from "react";
import { changeTagRelations } from "~/server/actions/usersTags";
import { toast } from "sonner";

export default function AdminPage() {
  const [sourceTagId, setSourceTagId] = useState("");
  const [targetTagId, setTargetTagId] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await changeTagRelations({
        sourceTagId,
        targetTagId,
      });

      if (result.success) {
        toast.success("Tags merged successfully");
        setSourceTagId("");
        setTargetTagId("");
      } else {
        toast.error(result.error || "Failed to merge tags");
      }
    } catch (error) {
      toast.error("An error occurred while merging tags");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="mb-6 text-2xl font-bold">Merge Tags</h1>
      <form onSubmit={handleSubmit} className="max-w-md space-y-4">
        <div>
          <label
            htmlFor="sourceTagId"
            className="mb-2 block text-sm font-medium"
          >
            Source Tag ID (will be deleted)
          </label>
          <input
            id="sourceTagId"
            type="text"
            value={sourceTagId}
            onChange={(e) => setSourceTagId(e.target.value)}
            className="w-full rounded border p-2"
            required
          />
        </div>

        <div>
          <label
            htmlFor="targetTagId"
            className="mb-2 block text-sm font-medium"
          >
            Target Tag ID (will receive content)
          </label>
          <input
            id="targetTagId"
            type="text"
            value={targetTagId}
            onChange={(e) => setTargetTagId(e.target.value)}
            className="w-full rounded border p-2"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:opacity-50"
        >
          {isLoading ? "Merging..." : "Merge Tags"}
        </button>
      </form>
    </div>
  );
}
