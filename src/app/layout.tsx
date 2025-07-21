import "~/styles/globals.css";
import { inter } from "~/app/ui/fonts";
import { PHProvider } from "~/app/providers";
import SideNav from "~/app/SideNav";
import { ThemeProvider } from "~/app/ThemeProvider";
import { Toaster } from "~/components/ui/sonner";
import { ClerkProvider } from "@clerk/nextjs";
import BottomNav from "./BottomNav";

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
    <ClerkProvider>
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
            {/* <NeynarProvider>
            <SessionProvider> */}
            <PHProvider>
              <div className="flex h-screen">
                <div className="hidden md:block">
                  <SideNav />
                </div>
                <div className="flex-1 overflow-y-auto">{children}</div>
                <BottomNav />
                <Toaster />
              </div>
            </PHProvider>
            {/* </SessionProvider>
          </NeynarProvider> */}
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
