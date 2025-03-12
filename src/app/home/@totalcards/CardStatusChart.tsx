"use client";
import * as React from "react";
import { Label, Pie, PieChart, Cell } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "~/components/ui/chart";
import type { CardStatusData } from "~/server/queries/dashboard";

interface CardStatusChartProps {
  data: CardStatusData[];
  totalCards: number;
}

export function CardStatusChart({ data, totalCards }: CardStatusChartProps) {
  // Create configuration for the chart
  const chartConfig = data.reduce(
    (config, item) => {
      return {
        ...config,
        [item.status]: {
          label: item.status,
          color: item.color,
        },
      };
    },
    {
      count: {
        label: "Cards",
      },
    },
  );

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Card Distribution</CardTitle>
        <CardDescription>By learning status</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => `${value}`}
                  formatter={(value, name) => [`${value}`, ` ${name}`]}
                />
              }
            />
            <Pie
              data={data}
              dataKey="count"
              nameKey="status"
              innerRadius={60}
              strokeWidth={5}
              paddingAngle={2}
              stroke="transparent"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-3xl font-bold"
                        >
                          {totalCards.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground"
                        >
                          Cards
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="mt-auto flex-col gap-2 text-sm">
        <div className="flex flex-wrap justify-center gap-3">
          {data.map((item, index) => (
            <div key={index} className="flex items-center gap-1">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-xs">
                {item.status}: {item.count}
              </span>
            </div>
          ))}
        </div>
        <div className="leading-none text-muted-foreground">
          Showing distribution of all your flashcards
        </div>
      </CardFooter>
    </Card>
  );
}
