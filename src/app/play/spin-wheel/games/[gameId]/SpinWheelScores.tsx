"use client";

import { GameSessionWithMoves } from "~/server/queries/gameSession";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartConfig, ChartContainer } from "~/components/ui/chart";
import { User } from "lucide-react";

interface PlayerScore {
  username: string;
  points: number;
  displayName: string | null;
  avatar: string | null;
}

const chartConfig = {
  points: {
    label: "Points",
    color: "#33A33C",
  },
} satisfies ChartConfig;

function calculatePlayerScores(
  gameSession: GameSessionWithMoves,
): PlayerScore[] {
  const pointsByPlayer = new Map<string, number>();

  gameSession.moves.forEach((move) => {
    const currentPoints = pointsByPlayer.get(move.player_username) || 0;
    pointsByPlayer.set(move.player_username, currentPoints + move.points);
  });

  return gameSession.player_info
    .map((player) => ({
      username: player.username,
      points: pointsByPlayer.get(player.username) || 0,
      displayName: player.display_name,
      avatar: player.avatar_url || player.pfp_url,
    }))
    .sort((a, b) => b.points - a.points);
}

export function SpinWheelScores({
  gameSession,
}: {
  gameSession: GameSessionWithMoves;
}) {
  const playerScores = calculatePlayerScores(gameSession);
  const CustomTick = ({ x, y, payload }: any) => {
    const playerData = playerScores.find((p) => p.username === payload.value);
    const avatarUrl = playerData?.avatar;
    return (
      <g transform={`translate(${x},${y})`}>
        {avatarUrl ? (
          <image
            x={-15}
            y={10}
            width={30}
            height={30}
            xlinkHref={avatarUrl}
            style={{ clipPath: "circle(40%)", objectFit: "cover" }}
          />
        ) : (
          <g transform="translate(-15, 0)">
            <circle cx="15" cy="15" r="15" fill="#e5e7eb" />
            <User
              x="7"
              y="7"
              width="16"
              height="16"
              className="text-gray-500"
            />
          </g>
        )}
        <text x={0} y={55} textAnchor="middle" fill="#666" fontSize={12}>
          {payload.value}
        </text>
      </g>
    );
  };
  return (
    <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
      <BarChart
        accessibilityLayer
        data={playerScores}
        margin={{ top: 20, right: 30, left: 0, bottom: 50 }}
      >
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="username"
          tick={<CustomTick />}
          tickLine={false}
          tickMargin={10}
          axisLine={false}
        />
        <YAxis
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          tickFormatter={(value) => `${value}`}
        />
        <Bar dataKey="points" fill="var(--color-points)" radius={4} />
      </BarChart>
    </ChartContainer>
  );
}
