"use client";

import { Button } from "~/components/ui/button";
import { Card, CardHeader, CardContent } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";

interface Tag {
  id: string;
  name: string;
}

interface PlayerTags {
  username: string;
  tags: Tag[];
}

interface TopicListProps {
  players: PlayerTags[];
  onTopicSelect: (topic: Tag) => void;
  selectedTopic: Tag;
}

export default function TopicList({
  players,
  onTopicSelect,
  selectedTopic,
}: TopicListProps) {
  return (
    <div className="space-y-6">
      {players?.map((player) => (
        <Card key={player.username} className="w-full">
          <CardHeader>
            <h3 className="text-lg font-semibold">@{player.username}</h3>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {player.tags.map((tag) => {
                const isSelected = selectedTopic.name === tag.name;
                return (
                  <Button
                    key={tag.id}
                    variant={isSelected ? "secondary" : "outline"}
                    size="sm"
                    onClick={() =>
                      onTopicSelect({
                        name: tag.name.toLowerCase(),
                        id: tag.id,
                      })
                    }
                    className="rounded-full transition-all duration-200"
                  >
                    {tag.name}
                    {isSelected && (
                      <Badge
                        variant="secondary"
                        className="ml-2 bg-green-500 text-white"
                      >
                        Selected
                      </Badge>
                    )}
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
