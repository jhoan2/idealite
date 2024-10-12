import "~/styles/globals.css";
import { inter } from '~/app/ui/fonts';
import { PHProvider } from "~/app/providers";
import SideNav from "~/app/SideNav";
import { ThemeProvider } from "~/app/ThemeProvider";

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning={true}  className={`${inter.className} antialiased`}>
      <body suppressHydrationWarning={true}>
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
