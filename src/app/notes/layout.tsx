import { SidebarInset } from "~/components/ui/sidebar";

export default function NotesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarInset>
      <div className="flex flex-1 flex-col gap-4 p-4">
        {children}
      </div>
    </SidebarInset>
  );
}
