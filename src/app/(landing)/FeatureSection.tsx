"use client";

import { useState } from "react";
import { Pickaxe, Image, Globe } from "lucide-react";

const features = [
  {
    id: "visual-mnemonic",
    icon: Image,
    title: "Make it fun",
    subtitle: "Visual mnemonics",
    description:
      "Create visual mnemonics with the method of loci technique and take your memory palaces to the next level.",
    image: "/visual-mnemonic.png",
  },
  {
    id: "learning-interesting",
    icon: Globe,
    title: "Keep it interesting",
    subtitle: "Visualize facts so they come alive",
    description:
      "Turn dry facts into scenes you can actually picture and revisit.",
    image: "/learning-interesting.png",
  },
  {
    id: "ai-work",
    icon: Pickaxe,
    title: "Put AI to work",
    subtitle: "Turn your visuals into study aids",
    description:
      "AI converts your imagined scenes into polished memory tools. Structured and ready to use.",
    image: "/ai-work.png",
  },
] as const;

type Feature = (typeof features)[number];

export default function MinimalVariation() {
  const [activeFeature, setActiveFeature] = useState<Feature>(
    features[0] as Feature,
  );

  return (
    <section className="relative py-20">
      {/* Background with gradient and grid */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-100"></div>

      {/* Content */}
      <div className="container relative mx-auto max-w-6xl px-4">
        <div className="mb-16 text-center">
          <h2 className="mb-6 text-4xl font-bold text-black md:text-5xl">
            Reduce the friction to learning{" "}
          </h2>
        </div>

        <div className="grid items-start gap-12 lg:grid-cols-5">
          {/* Left Side - Minimal Buttons */}
          <div className="space-y-2 lg:col-span-2">
            {features.map((feature) => {
              const Icon = feature.icon;
              const isActive = activeFeature.id === feature.id;

              return (
                <button
                  key={feature.id}
                  className={`group w-full rounded-lg p-4 text-left transition-all duration-200 ${
                    isActive
                      ? "border-l-4 border-slate-900 bg-slate-100 dark:border-slate-100 dark:bg-slate-800"
                      : "hover:bg-slate-50 dark:hover:bg-slate-900/50"
                  }`}
                  onClick={() => setActiveFeature(feature)}
                >
                  <div className="mb-2 flex items-center gap-3">
                    <Icon
                      className={`h-5 w-5 ${isActive ? "text-slate-900 dark:text-slate-100" : "text-slate-500"}`}
                    />
                    <h3
                      className={`font-medium ${isActive ? "text-slate-900 dark:text-slate-100" : "text-slate-700 dark:text-slate-300"}`}
                    >
                      {feature.title}
                    </h3>
                  </div>
                  <p className="mb-1 text-sm text-slate-500 dark:text-slate-400">
                    {feature.subtitle}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {feature.description}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Right Side - Clean Image */}
          <div className="lg:col-span-3">
            <div className="relative overflow-hidden rounded-2xl shadow-xl">
              <img
                src={activeFeature.image || "/placeholder.svg"}
                alt={activeFeature.title}
                className="h-[400px] w-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
