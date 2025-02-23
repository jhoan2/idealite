import { useState } from "react";

export default function PlayTopNav() {
  const [activeTab, setActiveTab] = useState("Play");

  const tabs = [
    { id: "play", label: "Play", hasNotification: false },
    { id: "feed", label: "Feed", hasNotification: false },
    { id: "leaderboard", label: "Leaderboard", hasNotification: true },
    { id: "friends", label: "Friends", hasNotification: false },
  ];
  return (
    <nav className="w-full border-t border-border bg-background">
      <div className="mx-auto flex max-w-2xl justify-between">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.label)}
            className={`group relative flex min-w-[80px] items-center justify-center px-4 py-3 transition-all duration-200 ease-in-out ${
              activeTab === tab.label
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground/80"
            }`}
          >
            <span
              className={`text-sm transition-all duration-200 ${
                activeTab === tab.label ? "font-medium" : "font-normal"
              }`}
            >
              {tab.label}
            </span>

            {tab.hasNotification && (
              <span className="absolute -right-1 top-3 h-1.5 w-1.5 rounded-full bg-destructive" />
            )}

            {/* Active indicator line */}
            <div
              className={`absolute bottom-0 left-0 right-0 h-0.5 transform transition-all duration-200 ${
                activeTab === tab.label
                  ? "scale-x-100 bg-foreground"
                  : "scale-x-0 bg-transparent"
              }`}
            />

            {/* Hover indicator */}
            <div
              className={`absolute bottom-0 left-0 right-0 h-0.5 origin-center transform bg-muted transition-transform duration-200 ${
                activeTab === tab.label
                  ? "scale-x-0"
                  : "scale-x-0 group-hover:scale-x-100"
              }`}
            />
          </button>
        ))}
      </div>
    </nav>
  );
}
