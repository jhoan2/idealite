export default function PlayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="flex h-screen flex-col">{children}</div>;
}
