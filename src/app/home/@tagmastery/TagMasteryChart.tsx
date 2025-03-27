"use client";

import * as React from "react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { TagMasteryData } from "~/server/queries/dashboard";

// CustomTooltip component for the chart
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <Card className="border shadow-md">
        <CardHeader className="py-2">
          <CardTitle className="text-sm">{label}</CardTitle>
        </CardHeader>
        <CardContent className="py-2">
          <div className="text-xs text-emerald-500">
            Mastered: {payload[0].value}%
          </div>
          <div className="text-xs text-blue-500">
            Learning: {payload[1].value}%
          </div>
          <div className="text-xs text-gray-500">
            Paused: {payload[2]?.value || 10}%
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            Total cards: {payload[0].payload.total}
          </div>
        </CardContent>
      </Card>
    );
  }
  return null;
};

export default function TagMasteryChart({ data }: { data: TagMasteryData[] }) {
  // Handle empty data case
  if (!data || data.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Mastery Rate by Tag</CardTitle>
        </CardHeader>
        <CardContent className="flex h-[200px] items-center justify-center">
          <div className="flex flex-col items-center text-center text-muted-foreground">
            <p>No tag data available</p>
            <p className="text-sm">Create more cards to see mastery stats</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle>Mastery Rate by Tag</CardTitle>
        <CardDescription>Percentage of cards mastered per tag</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={data.length > 3 ? 300 : 200}>
          <BarChart data={data} layout="vertical" margin={{ right: 10 }}>
            <XAxis
              type="number"
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
              stroke="#888888"
              fontSize={12}
            />
            <YAxis
              dataKey="name"
              type="category"
              width={80}
              tickFormatter={(value) =>
                value.length > 10 ? `${value.substring(0, 10)}...` : value
              }
              stroke="#888888"
              fontSize={12}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "rgba(0, 0, 0, 0.05)" }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              iconSize={8}
            />
            <Bar
              dataKey="mastered"
              name="Mastered"
              fill="hsl(var(--chart-6))"
              stackId="a"
              radius={[0, 4, 4, 0]}
            />
            <Bar
              dataKey="active"
              name="Learning"
              fill="hsl(var(--chart-7))"
              stackId="a"
            />
            <Bar
              dataKey="suspended"
              name="Paused"
              fill="hsl(var(--chart-8))"
              stackId="a"
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
