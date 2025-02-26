"use client";

import { Users, Clock, Trophy, AlertTriangle } from "lucide-react";
import type { GameSession } from "~/server/db/schema";
import { useState, useEffect } from "react";
import Link from "next/link";

interface SessionProps {
  session: GameSession;
  game_type: string;
}

function getTimeRemaining(deadline: Date) {
  const total = deadline.getTime() - new Date().getTime();
  const hours = Math.floor(total / (1000 * 60 * 60));
  const minutes = Math.floor((total % (1000 * 60 * 60)) / (1000 * 60));

  if (total <= 0) {
    return "Time's up!";
  }

  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days} day${days !== 1 ? "s" : ""} left`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m left`;
  }

  return `${minutes}m left`;
}

export default function Session({ session, game_type }: SessionProps) {
  const [timeLeft, setTimeLeft] = useState(
    getTimeRemaining(new Date(session.turn_deadline)),
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(getTimeRemaining(new Date(session.turn_deadline)));
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, [session.turn_deadline]);

  const getStatusColor = (status: GameSession["status"]) => {
    switch (status) {
      case "created":
        return "bg-blue-500";
      case "in_progress":
        return "bg-green-500";
      case "completed":
        return "bg-purple-500";
      case "abandoned":
        return "bg-destructive text-destructive-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStatusIcon = (status: GameSession["status"]) => {
    switch (status) {
      case "created":
        return <Users className="h-6 w-6" />;
      case "in_progress":
        return <Clock className="h-6 w-6" />;
      case "completed":
        return <Trophy className="h-6 w-6" />;
      case "abandoned":
        return <AlertTriangle className="h-6 w-6" />;
      default:
        return null;
    }
  };

  return (
    <Link
      href={`/play/${game_type}/games/${session.id}`}
      className="block rounded-lg border bg-card text-card-foreground shadow-lg transition-transform hover:scale-105"
    >
      <div
        className={`flex items-center justify-between rounded-t-lg p-4 text-white ${getStatusColor(
          session.status,
        )}`}
      >
        <span className="font-semibold capitalize">
          {session.status.replace("_", " ")}
        </span>
        {getStatusIcon(session.status)}
      </div>
      <div className="p-6">
        <div className="mb-4">
          <span className="text-muted-foreground">Players:</span>
          <span className="ml-2 font-semibold">{session.player_count}</span>
        </div>
        <div className="mb-4">
          <span className="text-muted-foreground">Turn Deadline:</span>
          <span className="ml-2 font-semibold">{timeLeft}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Topics:</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {session.topics?.map((topic: string, i: number) => (
              <span
                key={i}
                className="rounded-full bg-accent/10 px-2 py-1 text-sm font-medium text-accent-foreground"
              >
                {topic}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
}
