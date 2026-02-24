import type { Metadata } from "next";

import { IBM_Plex_Mono, Libre_Baskerville, Lora } from "next/font/google";

import "../index.css";

import Providers from "@/components/providers";

const fontSans = Libre_Baskerville({
  subsets: ["latin"],
  variable: "--font-sans",
});

const fontSerif = Lora({
  subsets: ["latin"],
  variable: "--font-serif",
});

const fontMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600", "700"],
});
export const metadata: Metadata = {
  title: {
    default: "Chatty - Anonymous Chat Platform | Chat with Strangers Online",
    template: "%s | Chatty",
  },
  description:
    "Chat with strangers anonymously, join group chat rooms, and make friends online. Chatty is the free anonymous chat platform with gender matching, country matching, and real-time messaging.",
  keywords: [
    "anonymous chat",
    "chat with strangers",
    "random chat online",
    "meet new people",
    "online chat rooms",
    "group chat platform",
    "make friends online",
    "anonymous messaging",
    "free chat",
    "random chat",
  ],
  openGraph: {
    type: "website",
    siteName: "Chatty",
    title: "Chatty - Anonymous Chat Platform | Chat with Strangers Online",
    description:
      "Chat with strangers anonymously, join group chat rooms, and make friends online. Free anonymous chat with gender and country matching.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Chatty - Anonymous Chat Platform",
    description:
      "Chat with strangers anonymously. Join group chats, make friends, and connect worldwide.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${fontSans.variable} ${fontSerif.variable} ${fontMono.variable} antialiased`}
      >
        <Providers>
          <div className="grid grid-rows-[auto_1fr] h-svh">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
