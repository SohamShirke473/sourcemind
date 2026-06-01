import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { TRPCReactProvider } from "@/trpc/client";
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "SourceMind",
  description: "Chat with your sources",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col font-mono">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <ClerkProvider>
            <TRPCReactProvider>{children}</TRPCReactProvider>
          </ClerkProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
