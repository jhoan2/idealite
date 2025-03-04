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

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <Tabs
          defaultValue="generate"
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <div className="px-6">
            <TabsList className="w-full bg-slate-800 p-1">
              <TabsTrigger
                value="generate"
                className="flex-1 data-[state=active]:bg-slate-700"
              >
                Generate
              </TabsTrigger>
              <TabsTrigger
                value="edit"
                className="flex-1 data-[state=active]:bg-slate-700"
              >
                Edit
              </TabsTrigger>
              <TabsTrigger
                value="background"
                className="flex-1 data-[state=active]:bg-slate-700"
              >
                Background
              </TabsTrigger>
              <TabsTrigger
                value="outpainting"
                className="flex-1 data-[state=active]:bg-slate-700"
              >
                Outpainting
              </TabsTrigger>
            </TabsList>

            <TabsContent value="generate" className="mt-4">
              <Generate result={result} setResult={setResult} />
            </TabsContent>

            <TabsContent value="edit" className="mt-4">
              <ImageEdit result={result} setResult={setResult} />
            </TabsContent>

            <TabsContent value="background" className="mt-0">
              <Background result={result} setResult={setResult} />
            </TabsContent>

            <TabsContent value="outpainting" className="mt-0">
              <Outpainting result={result} setResult={setResult} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
