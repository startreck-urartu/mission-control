import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ConvexClientProvider } from "@/components/providers/convex-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { NavigationSidebar } from "@/components/navigation-sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased text-white noise`}
      >
        <ConvexClientProvider>
          <ThemeProvider>
            <div className="flex h-screen">
              <NavigationSidebar />
              <main className="flex-1 overflow-auto p-4 pt-16 md:p-6 md:pt-6">
                <div className="max-w-[1600px] mx-auto">
                  {children}
                </div>
              </main>
            </div>
          </ThemeProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
