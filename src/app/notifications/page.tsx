// src/app/notifications/page.tsx
import { Button } from "~/components/ui/button";
import {
  Bell,
  MessageSquare,
  UserPlus,
  Calendar,
  Settings,
  MoreVertical,
  MoreHorizontal,
} from "lucide-react";

export default function NotificationsPage() {
  const notifications = [
    {
      id: 1,
      type: "message",
      title: "New message from Sarah",
      description: "Hey! Are we still on for the meeting tomorrow?",
      timestamp: "2m",
      read: false,
      icon: MessageSquare,
    },
    {
      id: 2,
      type: "user",
      title: "New team member joined",
      description: "Alex Johnson has joined your workspace",
      timestamp: "1h",
      read: false,
      icon: UserPlus,
    },
    {
      id: 3,
      type: "calendar",
      title: "Meeting reminder",
      description: "Product review meeting starts in 30 minutes",
      timestamp: "2h",
      read: true,
      icon: Calendar,
    },
    {
      id: 4,
      type: "system",
      title: "System update completed",
      description: "Your workspace has been updated to the latest version",
      timestamp: "1d",
      read: true,
      icon: Settings,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 border-b bg-background/95 px-4 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <h1 className="text-lg font-semibold">Notifications</h1>
          </div>
          <Button variant="ghost" size="sm" className="p-2">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="divide-y divide-border">
        {notifications.map((notification) => {
          const IconComponent = notification.icon;
          return (
            <div
              key={notification.id}
              className={`flex items-start gap-3 px-4 py-4 transition-colors active:bg-muted/50 ${
                !notification.read ? "bg-muted/30" : "hover:bg-muted/30"
              }`}
            >
              <div
                className={`rounded-full p-2 ${!notification.read ? "bg-primary/10" : "bg-muted"}`}
              >
                <IconComponent
                  className={`h-4 w-4 ${!notification.read ? "text-primary" : "text-muted-foreground"}`}
                />
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <p
                    className={`truncate text-sm font-medium leading-none ${
                      !notification.read
                        ? "text-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {notification.title}
                  </p>
                  <div className="flex flex-shrink-0 items-center gap-2">
                    <p className="whitespace-nowrap text-xs text-muted-foreground">
                      {notification.timestamp}
                    </p>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-1">
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <p className="line-clamp-2 text-sm text-muted-foreground">
                  {notification.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-4 py-6">
        <Button variant="ghost" className="w-full text-sm">
          View all notifications
        </Button>
      </div>
    </div>
  );
}
