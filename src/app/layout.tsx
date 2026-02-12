// src/app/layout.tsx (Updated)
import "~/styles/globals.css";
import { inter, cinzel, jetbrainsMono, spaceGrotesk } from "~/app/ui/fonts";
import { PHProvider } from "~/app/providers";
import { ThemeProvider } from "~/app/ThemeProvider";
import { Toaster } from "~/components/ui/sonner";
import { ClerkProvider } from "@clerk/nextjs";
import SideBarWrapper from "./SideBarWrapper"; // Changed from SideBar to SideBarWrapper
import { SidebarProvider } from "~/components/ui/sidebar";
import ConditionalSidebarTrigger from "./ConditionalSidebarTrigger";
import { getBootstrapData } from "~/utils/posthog/getBootstrapData";
import { GoogleTag } from "~/components/GoogleTag";
import { SyncProvider } from "~/storage/SyncProvider";

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
  const bootstrapData = await getBootstrapData();

  return (
    <ClerkProvider waitlistUrl="/waitlist">
      <html
        lang="en"
        suppressHydrationWarning={true}
        className={`${inter.className} ${cinzel.variable} ${jetbrainsMono.variable} ${spaceGrotesk.variable} antialiased`}
      >
        <body suppressHydrationWarning={true}>
          <GoogleTag />
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <PHProvider bootstrapData={bootstrapData}>
              <SyncProvider>
                <SidebarProvider>
                  <div className="flex h-screen w-full">
                    <div className="">
                      <SideBarWrapper />
                    </div>
                    <div className="flex-1 overflow-y-auto">
                      <div className="md:hidden">
                        <ConditionalSidebarTrigger />
                      </div>
                      {children}
                    </div>
                    <Toaster />
                  </div>
                </SidebarProvider>
              </SyncProvider>
            </PHProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
