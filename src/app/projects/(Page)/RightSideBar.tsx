"use client";

import * as React from "react";
import { Menu, X } from "lucide-react";

import { Button } from "~/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarProvider,
} from "~/components/ui/sidebar";

export default function RightSideBar() {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <SidebarProvider>
      <div className="relative min-h-screen">
        <Button
          variant="outline"
          size="icon"
          className="fixed right-4 top-4 z-50"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
        >
          {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>

        <Sidebar
          open={isOpen}
          onOpenChange={setIsOpen}
          side="right"
          className={`fixed right-0 top-0 h-full w-64 transform transition-transform duration-300 ease-in-out ${
            isOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <SidebarHeader className="border-b p-4">
            <h2 className="text-lg font-semibold">Sidebar Header</h2>
          </SidebarHeader>
          <SidebarContent className="p-4">
            <p>This is the sidebar content.</p>
            <p className="mt-4">You can add more components or content here.</p>
          </SidebarContent>
        </Sidebar>

        <main className="p-4">
          <h1 className="mb-4 text-2xl font-bold">Main Content</h1>
          <p>
            This is the main content of your page. The sidebar will slide in
            from the right when the button is clicked.
          </p>
        </main>
      </div>
    </SidebarProvider>
  );
}
