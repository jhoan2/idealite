// src/app/notifications/layout.tsx
export default function NotificationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="h-full">{children}</div>;
}
