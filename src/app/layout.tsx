import "~/styles/globals.css";
import { inter } from "~/app/ui/fonts";
import { PHProvider } from "~/app/providers";
import SideNav from "~/app/SideNav";
import { ThemeProvider } from "~/app/ThemeProvider";
import NeynarProvider from "~/app/NeynarProvider";
import { Toaster } from "~/components/ui/sonner";
import { SessionProvider } from "next-auth/react";

export const metadata = {
  title: "idealite",
  description: "A mmo learning game",
  icons: {
    icon: "/icon48.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
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
          <NeynarProvider>
            <SessionProvider>
              <PHProvider>
                <div className="flex h-screen">
                  <div className="hidden md:block">
                    <SideNav />
                  </div>
                  <div className="flex-1 overflow-y-auto">{children}</div>
                  <Toaster />
                </div>
              </PHProvider>
            </SessionProvider>
          </NeynarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
