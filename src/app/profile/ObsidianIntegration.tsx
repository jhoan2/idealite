"use client";

import { useState, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "~/components/ui/dialog";
import { Copy, Key, Trash2 } from "lucide-react";
import { toast } from "sonner";

type ObsidianCredential = {
  id: string;
  provider: string;
  created_at: string;
  last_used: string | null;
  revoked_at: string | null;
};

export default function ObsidianIntegration() {
  const [credentials, setCredentials] = useState<ObsidianCredential[]>([]);
  const [loading, setLoading] = useState(true);
  const [newApiKey, setNewApiKey] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const fetchCredentials = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/integrations/obsidian/credentials");
      const data = await response.json();

      if (data.success) {
        setCredentials(data.credentials || []);
      }
    } catch (error) {
      toast.error("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCredentials();
  }, []);

  // Generate new API key
  const generateApiKey = async () => {
    try {
      const response = await fetch("/api/integrations/obsidian/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (response.ok && data.key) {
        setNewApiKey(data.key);
        setIsDialogOpen(true);
        fetchCredentials(); // Refresh the list
      } else {
        toast.error(data.error || "Failed to generate API key");
      }
    } catch (error) {
      toast.error("Failed to connect to server");
    }
  };

  // Revoke API key
  const revokeApiKey = async (id: string) => {
    try {
      const response = await fetch(
        `/api/integrations/obsidian/credentials/${id}`,
        {
          method: "DELETE",
        },
      );

      if (response.ok) {
        toast.success("API key revoked successfully");
        fetchCredentials(); // Refresh the list
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to revoke API key");
      }
    } catch (error) {
      toast.error("Failed to connect to server");
    }
  };

  return (
    <Card className="bg-card text-card-foreground">
      <CardHeader>
        <CardTitle className="text-foreground">Obsidian Integration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <p className="mb-4 text-sm text-muted-foreground">
            Connect your Obsidian vault to sync notes with your Idealite
            account.
          </p>

          {/* Setup instructions */}
          <div className="mb-6 space-y-3 rounded-md bg-muted p-4">
            <h4 className="font-medium text-foreground">Setup Instructions</h4>
            <ol className="list-inside list-decimal space-y-2 text-sm text-muted-foreground">
              <li>
                Install the Idealite plugin from Obsidian Community Plugins
              </li>
              <li>Generate an API key below</li>
              <li>Copy the API key to your Obsidian plugin settings</li>
              <li>Configure which notes to sync in Obsidian</li>
            </ol>
          </div>
        </div>

        {/* Generate new key */}
        <div className="pt-2">
          <Button
            onClick={generateApiKey}
            disabled={loading}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Key className="mr-2 h-4 w-4" />
            Generate API Key
          </Button>
        </div>

        {/* List existing keys */}
        <div className="space-y-4 pt-4">
          <h3 className="text-sm font-medium text-foreground">Your API Keys</h3>

          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : credentials.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No API keys found. Generate one to connect Obsidian.
            </p>
          ) : (
            <div className="space-y-3">
              {credentials.map((cred) => (
                <div
                  key={cred.id}
                  className={`flex items-center justify-between rounded-md border border-border p-3 ${
                    cred.revoked_at ? "bg-muted" : "bg-background"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center text-sm font-medium text-foreground">
                      Obsidian API Key
                      {cred.revoked_at && (
                        <span className="ml-2 rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                          Revoked
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Created: {new Date(cred.created_at).toLocaleDateString()}
                      {cred.last_used && (
                        <>
                          {" • "}
                          Last used:{" "}
                          {new Date(cred.last_used).toLocaleDateString()}
                        </>
                      )}
                    </div>
                  </div>
                  {!cred.revoked_at && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => revokeApiKey(cred.id)}
                      className="hover:bg-accent hover:text-accent-foreground"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* New key dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="border-border bg-background">
            <DialogHeader>
              <DialogTitle className="text-foreground">
                Your New API Key
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="mb-4 text-sm text-muted-foreground">
                This is your API key. Make sure to copy it now - you won't be
                able to see it again!
              </p>
              <div className="break-all rounded-md border border-border bg-muted p-4 font-mono text-sm text-foreground">
                {newApiKey}
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={() => {
                  if (newApiKey) navigator.clipboard.writeText(newApiKey);
                  toast.success("Copied to clipboard");
                }}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy to Clipboard
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="border-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground"
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
