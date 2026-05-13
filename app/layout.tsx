import type { Metadata } from "next";
import type { Viewport } from "next";
import type { ReactNode } from "react";
import { Plus_Jakarta_Sans } from "next/font/google";
import { AuthProvider } from "@/components/providers/auth-provider";
import { AdminSettingsProvider } from "@/components/providers/admin-settings-provider";
import { getPlatformSettings } from "@/lib/db/queries";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
  weight: ["400", "500", "700", "800"]
});

export const metadata: Metadata = {
  metadataBase: new URL("https://studentnest.example"),
  title: "StudentNest | Student Housing in Jalal-Abad",
  description:
    "A modern student housing rental platform for verified apartments, shared rooms, roommates, and university accommodation in Jalal-Abad.",
  alternates: {
    canonical: "/"
  },
  openGraph: {
    title: "StudentNest",
    description: "Find safe, affordable student housing near universities in Jalal-Abad.",
    type: "website"
  },
  robots: {
    index: true,
    follow: true
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff"
};

export default async function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  const settings = await getPlatformSettings();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: "try{if(document.cookie.split('; ').find(function(item){return item.indexOf('studentnest-theme=')===0;})?.split('=')[1]==='dark'){document.documentElement.classList.add('dark')}}catch(e){}"
          }}
        />
      </head>
      <body className={plusJakarta.variable}>
        <AuthProvider>
          <AdminSettingsProvider settings={settings}>{children}</AdminSettingsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
