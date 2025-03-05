"use client";

import { useState } from "react";
import { Generate } from "./Generate";
import { ImageEdit } from "./ImageEdit";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Background } from "./Background";
import { Outpainting } from "./Outpainting";

export interface GeneratedImageResult {
  image: string;
  description?: string;
}

export function MemoryPalace() {
  const [activeTab, setActiveTab] = useState("generate");
  const [result, setResult] = useState<GeneratedImageResult | null>(null);
  const [prompt, setPrompt] = useState("");
  const [description, setDescription] = useState("");

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <Tabs
          defaultValue="generate"
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="w-full border-border bg-background p-1">
            <TabsTrigger
              value="generate"
              className="flex-1 text-foreground data-[state=active]:bg-accent"
            >
              Generate
            </TabsTrigger>
            <TabsTrigger
              value="edit"
              className="flex-1 text-foreground data-[state=active]:bg-accent"
            >
              Edit
            </TabsTrigger>
            <TabsTrigger
              value="background"
              className="flex-1 text-foreground data-[state=active]:bg-accent"
            >
              Background
            </TabsTrigger>
            <TabsTrigger
              value="outpainting"
              className="flex-1 text-foreground data-[state=active]:bg-accent"
            >
              Outpainting
            </TabsTrigger>
          </TabsList>

          <TabsContent value="generate" className="mt-4">
            <Generate
              result={result}
              setResult={setResult}
              prompt={prompt}
              setPrompt={setPrompt}
              description={description}
              setDescription={setDescription}
            />
          </TabsContent>

          <TabsContent value="edit" className="mt-4">
            <ImageEdit
              result={result}
              setResult={setResult}
              prompt={prompt}
              setPrompt={setPrompt}
              description={description}
              setDescription={setDescription}
            />
          </TabsContent>

          <TabsContent value="background" className="mt-0">
            <Background result={result} setResult={setResult} />
          </TabsContent>

          <TabsContent value="outpainting" className="mt-0">
            <Outpainting
              result={result}
              setResult={setResult}
              prompt={prompt}
              setPrompt={setPrompt}
              description={description}
              setDescription={setDescription}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
