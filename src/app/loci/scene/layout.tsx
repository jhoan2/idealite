import { SidebarInset } from "~/components/ui/sidebar";

export default function LociSceneLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarInset>
      <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
        <p className="text-sm font-medium">Loci Scene Studio</p>
      </header>
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </SidebarInset>
  );
}
