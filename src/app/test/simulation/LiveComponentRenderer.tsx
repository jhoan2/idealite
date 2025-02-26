// src/app/learn/components/LiveComponentRenderer.tsx
"use client";

import React, { useState, useEffect } from "react";
import { LiveProvider, LiveError, LivePreview } from "react-live";
import { Loader2, Code } from "lucide-react";
import * as Sentry from "@sentry/nextjs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Button } from "~/components/ui/button";

// Import any libraries that should be available to the component
import * as recharts from "recharts";
import * as lucide from "lucide-react";

interface LiveComponentRendererProps {
  componentId: string;
  componentCode?: string;
  showCode?: boolean;
  onError?: (error: Error) => void;
}

const LiveComponentRenderer: React.FC<LiveComponentRendererProps> = ({
  componentId,
  componentCode,
  showCode = false,
  onError,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(
    `function InteractiveComponent() {
      const [n, setN] = React.useState(5);
      const [r, setR] = React.useState(3);
      const [showPermutations, setShowPermutations] = React.useState(true);
    
      const factorial = (num) => (num <= 1 ? 1 : num * factorial(num - 1));
      
      const permutations = factorial(n) / factorial(n - r);
      const combinations = factorial(n) / (factorial(r) * factorial(n - r));
    
      return (
        <div className="p-4 rounded-lg shadow-lg bg-white">
          <h2 className="text-2xl font-bold mb-4">Permutations & Combinations</h2>
          
          <div className="mb-4">
            <div className="mb-2">
              <label className="mr-2">n (set size):</label>
              <input type="range" min={1} max={10} value={n} 
                onChange={e => setN(Number(e.target.value))} className="w-1/2" />
              <span className="ml-2 font-bold">{n}</span>
            </div>
    
            <div>
              <label className="mr-2">r (selection size):</label>
              <input type="range" min={0} max={n} value={r}
                onChange={e => setR(Number(e.target.value))} className="w-1/2" />
              <span className="ml-2 font-bold">{r}</span>
            </div>
          </div>
          
          <div className="flex justify-evenly mb-4">
            <button onClick={() => setShowPermutations(true)}
              className={\`py-2 px-4 rounded-lg text-white \${
                showPermutations ? 'bg-blue-500' : 'bg-gray-400'}\`}>
              Permutations
            </button>
            <button onClick={() => setShowPermutations(false)}  
              className={\`py-2 px-4 rounded-lg text-white \${
                showPermutations ? 'bg-gray-400' : 'bg-blue-500'}\`}>
              Combinations
            </button>
          </div>
    
          <p className="text-xl mb-2">
            {showPermutations ? 'Permutations' : 'Combinations'} are ways to select items from
            a collection, {showPermutations ? 'where the order matters' : 'where the order does not matter'}.
          </p>
    
          <p className="text-xl">
            There are <strong>{showPermutations ? permutations : combinations}</strong> {' '}
            {showPermutations ? 'permutations' : 'combinations'} of {r} item{r===1?'':'s'} from
            a set of {n} item{n===1?'':'s'}.
          </p>
          
          <div className="mt-4 text-gray-500">
            <p>Formula for permutations: <code>n! / (n-r)!</code></p>
            <p>Formula for combinations: <code>n! / (r! * (n-r)!)</code></p>
          </div>
        </div>
      );
    }
    
    render(<InteractiveComponent />);`,
  );
  const [activeTab, setActiveTab] = useState<"preview" | "code">("preview");
  const [isCodeVisible, setIsCodeVisible] = useState(showCode);

  const toggleCodeVisibility = () => {
    setIsCodeVisible(!isCodeVisible);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading component...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive bg-destructive/10 p-6">
        <h3 className="mb-2 text-lg font-semibold text-destructive">
          Error loading component
        </h3>
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (!code) {
    return (
      <div className="border-warning bg-warning/10 rounded-lg border p-6">
        <h3 className="text-warning mb-2 text-lg font-semibold">
          Component not available
        </h3>
        <p className="text-sm text-muted-foreground">
          The component could not be loaded.
        </p>
      </div>
    );
  }

  // Prepare the scope with necessary dependencies
  const scope = {
    React,
    ...recharts,
    ...lucide,
  };

  return (
    <div className="w-full rounded-lg border bg-card shadow">
      <div className="flex items-center justify-between border-b p-4">
        <h3 className="font-medium">Interactive Component</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={toggleCodeVisibility}
          className="flex items-center gap-1"
        >
          <Code className="h-4 w-4" />
          {isCodeVisible ? "Hide Code" : "View Code"}
        </Button>
      </div>

      {isCodeVisible ? (
        <Tabs
          defaultValue="preview"
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as "preview" | "code")}
        >
          <div className="border-b px-4">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="code">Code</TabsTrigger>
            </TabsList>
          </div>

          <LiveProvider
            code={code}
            scope={scope}
            noInline={code.includes("render(")}
          >
            <TabsContent value="preview" className="p-4">
              <div className="rounded-md bg-background p-4">
                <LiveError className="mb-4 rounded bg-red-50 p-2 text-sm text-red-500" />
                <LivePreview />
              </div>
            </TabsContent>

            <TabsContent value="code" className="p-4">
              <pre className="max-h-[500px] overflow-auto rounded-md bg-muted p-4">
                <code className="text-sm">{code}</code>
              </pre>
            </TabsContent>
          </LiveProvider>
        </Tabs>
      ) : (
        <LiveProvider
          code={code}
          scope={scope}
          noInline={code.includes("render(")}
        >
          <div className="p-4">
            <LiveError className="mb-4 rounded bg-red-50 p-2 text-sm text-red-500" />
            <LivePreview />
          </div>
        </LiveProvider>
      )}
    </div>
  );
};

export default LiveComponentRenderer;
