import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";
import { getSettings } from "@/app/admin/settings/actions";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();

  const storeName = settings?.storeName || "Reservation System";
  const storeLogo = settings?.StoreLogo;

  return {
    title: `${storeName} - Live Availability`,
    description: "",
    icons: {
      icon: storeLogo || "/favicon.ico",
      apple: storeLogo || "/favicon.ico",
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html
      lang="en"
      className={cn(
        "h-full",
        "antialiased",
        "font-sans",
        inter.variable
      )}
      suppressHydrationWarning
    >
      <body className="h-full">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
