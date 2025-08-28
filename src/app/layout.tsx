// src/app/layout.tsx (Updated)
import "~/styles/globals.css";
import { inter } from "~/app/ui/fonts";
import { PHProvider } from "~/app/providers";
import { ThemeProvider } from "~/app/ThemeProvider";
import { Toaster } from "~/components/ui/sonner";
import { ClerkProvider } from "@clerk/nextjs";
import SideBarWrapper from "./SideBarWrapper"; // Changed from SideBar to SideBarWrapper
import { SidebarProvider, SidebarTrigger } from "~/components/ui/sidebar";
import ConditionalSidebarTrigger from "./ConditionalSidebarTrigger";

export const metadata = {
  title: "idealite",
  description: "Learning management system for autodidacts",
  icons: {
    icon: "/icon48-dark.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider waitlistUrl="/waitlist">
      <html
        lang="en"
        suppressHydrationWarning={true}
        className={`${inter.className} antialiased`}
      >
        <body suppressHydrationWarning={true}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <PHProvider>
              <SidebarProvider>
                <div className="flex h-screen w-full">
                  <div className="">
                    <SideBarWrapper />
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    <div className="p-2 md:hidden">
                      <ConditionalSidebarTrigger />
                    </div>
                    {children}
                  </div>
                  <Toaster />
                </div>
              </SidebarProvider>
            </PHProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
