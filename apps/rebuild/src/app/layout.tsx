import DrawerProvider from "@/context/DrawerProvider";
import { fraunces, geistMono, lobster, workSans } from "@/fonts";
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
      className={`${fraunces.variable} ${geistMono.variable} ${lobster.variable} ${workSans.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <DrawerProvider>{children}</DrawerProvider>
      </body>
    </html>
  );
}

export default RootLayout;
