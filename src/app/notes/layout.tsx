import { SidebarInset } from "~/components/ui/sidebar";
import { NotesWorkspaceShell } from "./_components/NotesWorkspaceShell";

export default function NotesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarInset>
      <NotesWorkspaceShell>{children}</NotesWorkspaceShell>
    </SidebarInset>
  );
}
