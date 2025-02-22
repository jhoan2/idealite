"use client";

import { useState, useEffect } from "react";
import { getPlayersRecentTags } from "~/server/queries/gameSession";
import { GameSession } from "~/server/db/schema";
import TopicList from "./TopicList";
import { Button } from "~/components/ui/button";
import { addTopicToGame } from "~/server/actions/gameSession";
import { Loader2 } from "lucide-react";

interface Topic {
  id: string;
  name: string;
}

export default function SelectTopic({
  gameSession,
  currentUsername,
}: {
  gameSession: GameSession;
  currentUsername: string;
}) {
  const [playersRecentTags, setPlayersRecentTags] = useState<any>(null);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleTopicSelect = (topic: Topic) => {
    setSelectedTopic(topic);
  };

  const handleSubmit = async () => {
    setIsGenerating(true);
    fetch("/api/trivia/ensureCache", {
      method: "POST",
      body: JSON.stringify({
        topicName: selectedTopic?.name,
        topicId: selectedTopic?.id,
      }),
    });
    await addTopicToGame(gameSession.id, selectedTopic?.name || "");
    setIsGenerating(false);
  };

  useEffect(() => {
    const fetchTags = async () => {
      const otherPlayers = gameSession.players.filter(
        (player) => player !== currentUsername,
      );
      const tags = await getPlayersRecentTags(otherPlayers);
      setPlayersRecentTags(tags.data);
    };

    fetchTags();
  }, [gameSession.players, currentUsername]);

  return (
    <div className="container mx-auto p-6">
      <h2 className="mb-6 text-2xl font-bold">Select Topics</h2>
      <TopicList
        players={playersRecentTags}
        onTopicSelect={handleTopicSelect}
        selectedTopic={selectedTopic || { name: "", id: "" }}
      />
      {selectedTopic && (
        <div className="flex justify-end">
          <Button
            className="mt-6"
            size="lg"
            onClick={handleSubmit}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
