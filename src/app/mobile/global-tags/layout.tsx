// app/mobile/global-tags/layout.tsx
export default function MobileGlobalTagsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="h-screen w-full overflow-hidden">{children}</div>;
}
