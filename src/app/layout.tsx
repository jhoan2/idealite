import "~/styles/globals.css";

import { GeistSans } from "geist/font/sans";
import { PHProvider } from "~/app/providers";
import SideNav from "~/app/SideNav";
import { ThemeProvider } from "~/app/ThemeProvider";

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${GeistSans.variable}`}>
      <body>
        <ThemeProvider>
          <PHProvider>
            <div className="flex h-screen">
              <SideNav />
              {children}
            </div>
          </PHProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
