import { Sidebar, SidebarContent } from "~/components/ui/sidebar";

export default function SideBar() {
  return (
    <Sidebar>
      <SidebarContent>
        {/* Empty for now - add your navigation content here later */}
        <div className="p-4">
          <p className="text-sm text-muted-foreground">
            Sidebar content goes here
          </p>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
