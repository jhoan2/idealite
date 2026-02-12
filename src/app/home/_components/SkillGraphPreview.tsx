"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import type { SkillGraphAxis } from "~/server/queries/skillGraph";

type SkillGraphPreviewProps = {
  axes: SkillGraphAxis[];
  ownedTagCount: number;
};

type SkillGraphChartDatum = SkillGraphAxis & {
  score: number;
  label: string;
};

type SkillGraphTooltipProps = {
  active?: boolean;
  payload?: Array<{ payload: SkillGraphChartDatum }>;
};

function truncateLabel(label: string, maxLength = 18) {
  if (label.length <= maxLength) return label;
  return `${label.slice(0, maxLength - 1)}...`;
}

function formatDate(value: string | null) {
  if (!value) return "No recent card";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No recent card";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function SkillGraphTooltip({ active, payload }: SkillGraphTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const point = payload[0]?.payload;
  if (!point) return null;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 text-xs shadow-lg dark:border-slate-700 dark:bg-slate-900">
      <p className="mb-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
        {point.skill}
      </p>
      <p className="text-slate-700 dark:text-slate-300">
        Relative: {point.displayScore}
      </p>
      <p className="text-slate-700 dark:text-slate-300">
        Absolute: {point.absoluteScore}
      </p>
      <p className="text-slate-700 dark:text-slate-300">
        Cards: {point.totalCards} ({point.masteredCards} mastered)
      </p>
      <p className="text-slate-600 dark:text-slate-400">
        Last card: {formatDate(point.lastCardCreatedAt)}
      </p>
    </div>
  );
}

export default function SkillGraphPreview({
  axes,
  ownedTagCount,
}: SkillGraphPreviewProps) {
  const chartData = useMemo(
    () =>
      axes.map((axis) => ({
        ...axis,
        score: axis.displayScore,
        label: truncateLabel(axis.skill),
      })),
    [axes],
  );

  const hasNoTags = ownedTagCount === 0;
  const showPlaceholder = chartData.length === 0;

  const placeholderData = useMemo(
    () => [
      { label: "Skill A", score: 42 },
      { label: "Skill B", score: 42 },
      { label: "Skill C", score: 42 },
      { label: "Skill D", score: 42 },
      { label: "Skill E", score: 42 },
    ],
    [],
  );

  const displayedData = showPlaceholder ? placeholderData : chartData;

  return (
    <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950 md:p-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          Skill Graph
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Relative performance across your recently active leaf tags.
        </p>
      </div>

      <div className="relative h-[250px] w-full md:h-[300px]">
        <div className="absolute inset-0">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={displayedData} cx="50%" cy="50%" outerRadius="64%">
              <PolarGrid stroke="#d4d4d8" />
              <PolarAngleAxis
                dataKey="label"
                tick={{ fill: "#475569", fontSize: 12, fontWeight: 500 }}
              />
              <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
              {!showPlaceholder && (
                <Tooltip cursor={false} content={<SkillGraphTooltip />} />
              )}
              <Radar
                dataKey="score"
                stroke={showPlaceholder ? "#94A3B8" : "#4F46E5"}
                fill={showPlaceholder ? "#94A3B8" : "#6366F1"}
                fillOpacity={showPlaceholder ? 0.14 : 0.28}
                strokeWidth={2.5}
                strokeDasharray={showPlaceholder ? "6 4" : undefined}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {showPlaceholder && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
              No data yet
            </span>
          </div>
        )}
      </div>

      {hasNoTags ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300">
          <p>
            You do not have any tags yet. Create or add your first tag to start
            generating your skill graph.
          </p>
          <Link
            href="/workspace/global-tags"
            className="mt-3 inline-flex items-center rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
          >
            Go to Global Tags
          </Link>
        </div>
      ) : null}
    </div>
  );
}
