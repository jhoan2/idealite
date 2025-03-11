"use client";

import { useState } from "react";
import { Card, CardContent } from "~/components/ui/card";
import {
  PlusCircle,
  Clock,
  Calendar,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { cn } from "~/lib/utils";
import type { CardActivityStats } from "~/server/queries/dashboard";

type StatCardProps = {
  title: string;
  value: number;
  changePercent: number;
  icon: React.ReactNode;
  description?: string;
  isPercentage?: boolean;
  isPercentagePoint?: boolean;
  color?: "default" | "blue" | "green" | "amber" | "rose";
};

function StatCard({
  title,
  value,
  changePercent,
  icon,
  description,
  isPercentage = false,
  isPercentagePoint = false,
  color = "default",
}: StatCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const colorStyles = {
    default: "from-primary/10 to-primary/5 text-primary",
    blue: "from-blue-500/10 to-blue-500/5 text-blue-500",
    green: "from-green-500/10 to-green-500/5 text-green-500",
    amber: "from-amber-500/10 to-amber-500/5 text-amber-500",
    rose: "from-rose-500/10 to-rose-500/5 text-rose-500",
  };

  const isIncrease = changePercent > 0;
  const isDecrease = changePercent < 0;
  const isZero = changePercent === 0;

  let TrendIcon = isIncrease ? TrendingUp : isDecrease ? TrendingDown : Minus;

  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-all duration-300 hover:shadow-lg",
        isHovered ? "scale-[1.02]" : "",
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardContent className="p-6">
        <div
          className={cn(
            "absolute -right-4 -top-4 h-24 w-24 rounded-full bg-gradient-to-br opacity-20",
            colorStyles[color].split(" ")[0], // Use the "from-" class for the gradient
          )}
          style={{
            transform: isHovered ? "scale(1.2)" : "scale(1)",
            transition: "transform 0.3s ease-in-out",
          }}
        />

        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="mt-1 flex items-baseline">
              <h3 className="text-3xl font-bold tracking-tight">
                {value.toLocaleString()}
                {isPercentage && "%"}
              </h3>

              {changePercent !== undefined && (
                <span
                  className={cn(
                    "ml-2 text-xs font-medium",
                    isIncrease
                      ? "text-green-600"
                      : isDecrease
                        ? "text-rose-600"
                        : "text-muted-foreground",
                  )}
                >
                  <span className="flex items-center">
                    {!isZero && <TrendIcon className="mr-1 h-3 w-3" />}
                    {isPercentagePoint
                      ? `${isIncrease ? "+" : ""}${changePercent} pts`
                      : `${isIncrease ? "+" : ""}${changePercent}%`}
                  </span>
                </span>
              )}
            </div>
            {description && (
              <p className="mt-1 text-xs text-muted-foreground">
                {description}
              </p>
            )}
          </div>

          <div
            className={cn(
              "rounded-full bg-gradient-to-br p-3",
              colorStyles[color],
            )}
          >
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function CardActivityStatsComponent({
  stats,
}: {
  stats: CardActivityStats;
}) {
  return (
    <>
      <StatCard
        title="New Cards"
        value={stats.cardsCreatedThisWeek}
        changePercent={stats.createdChangePercent}
        icon={<PlusCircle className="h-5 w-5" />}
        description="Created this week"
        color="blue"
      />

      <StatCard
        title="Cards Reviewed"
        value={stats.cardsReviewedThisWeek}
        changePercent={stats.reviewedChangePercent}
        icon={<Clock className="h-5 w-5" />}
        description="In the past 7 days"
        color="green"
      />

      <StatCard
        title="Due Soon"
        value={stats.cardsDueThisWeek}
        changePercent={stats.dueChangePercent}
        icon={<Calendar className="h-5 w-5" />}
        description="Coming up this week"
        color="amber"
      />

      <StatCard
        title="Review Rate"
        value={stats.reviewCompletionRate}
        changePercent={stats.completionRateChange}
        icon={<CheckCircle2 className="h-5 w-5" />}
        description="Overdue cards reviewed"
        isPercentage={true}
        isPercentagePoint={true}
        color="rose"
      />
    </>
  );
}
