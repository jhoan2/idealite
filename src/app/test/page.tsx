"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { searchPages } from "~/server/actions/page";

export default function TestPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const handleSearch = async () => {
    try {
      const result = await searchPages(searchQuery);
      console.log(result);
      if (result.success) {
        setSearchResults(result.data || []);
      } else {
        console.error("Search failed:", result.error);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex gap-2">
        <Input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search pages..."
        />
        <Button onClick={handleSearch}>Search</Button>
      </div>

      {/* Display results */}
      <div className="space-y-2">
        {searchResults.map((page) => (
          <div key={page.id} className="rounded border p-2">
            <h3>{page.title}</h3>
            <p className="text-sm text-gray-500">
              Last updated: {new Date(page.updated_at).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
