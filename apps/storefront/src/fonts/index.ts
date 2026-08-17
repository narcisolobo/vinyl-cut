import { Bungee, Geist_Mono, Lobster, Outfit } from "next/font/google";

const lobster = Lobster({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  variable: "--font-lobster",
});

const bungee = Bungee({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-bungee",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const outfit = Outfit({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-outfit",
});

export { bungee, geistMono, lobster, outfit };
