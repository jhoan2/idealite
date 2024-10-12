import "~/styles/globals.css";
import { inter } from '~/app/ui/fonts';
import { PHProvider } from "~/app/providers";
import SideNav from "~/app/SideNav";
import { ThemeProvider } from "~/app/ThemeProvider";
import NeynarProvider from "~/app/NeynarProvider";


export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning={true}  className={`${inter.className} antialiased`}>
      <body suppressHydrationWarning={true}>
          <PHProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <NeynarProvider>
                <div className="flex h-screen">
                    <SideNav />
                    {children}
                </div>
              </NeynarProvider>
            </ThemeProvider>
          </PHProvider>
      </body>
    </html>
  );
}
