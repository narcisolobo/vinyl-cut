import { bungee, geistMono, lobster, spaceGrotesk } from "@/fonts";
import "@/styles/globals.css";
import { type ReactNode } from "react";

interface RootLayoutProps {
  children: ReactNode;
}

function RootLayout({ children }: RootLayoutProps) {
  return (
    <html
      lang="en"
      data-theme="vinyl-cut"
      className={`${bungee.variable} ${geistMono.variable} ${lobster.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="relative flex min-h-full flex-col">{children}</body>
    </html>
  );
}

export default RootLayout;
