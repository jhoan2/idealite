"use client";

import { useState, useEffect } from "react";
import { getPlayersRecentTags } from "~/server/queries/gameSession";
import { GameSession } from "~/server/db/schema";
import TopicList from "./TopicList";
import { Button } from "~/components/ui/button";
import { addTopicToGame } from "~/server/actions/gameSession";

export default function SelectTopic({
  gameSession,
  currentUsername,
}: {
  gameSession: GameSession;
  currentUsername: string;
}) {
  const [playersRecentTags, setPlayersRecentTags] = useState<any>(null);
  const [selectedTopic, setSelectedTopic] = useState<string>("");

  const handleTopicSelect = (topic: string) => {
    setSelectedTopic(topic);
  };

  const handleSubmit = async () => {
    fetch("/api/trivia/ensureCache", {
      method: "POST",
      body: JSON.stringify({ topic: selectedTopic.toLowerCase() }),
    });
    await addTopicToGame(gameSession.id, selectedTopic);
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
        selectedTopic={selectedTopic}
      />
      {selectedTopic && (
        <div className="flex justify-end">
          <Button className="mt-6" size="lg" onClick={handleSubmit}>
            Submit
          </Button>
        </div>
      )}
    </div>
  );
}
