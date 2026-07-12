import type { Metadata } from "next";
import "./globals.css";
import { ConvexClientProvider } from "@/components/providers/convex-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { NavigationSidebar } from "@/components/navigation-sidebar";

export const metadata: Metadata = {
  title: "OpenClaw Mission Control",
  description: "Mission Control Dashboard for OpenClaw",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-background text-foreground">
        <ConvexClientProvider>
          <ThemeProvider>
            <div className="flex h-screen gap-4 p-4">
              <NavigationSidebar />
              <main className="flex-1 overflow-auto pt-14 md:pt-0">
                <div className="max-w-[1600px] mx-auto">{children}</div>
              </main>
            </div>
          </ThemeProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
