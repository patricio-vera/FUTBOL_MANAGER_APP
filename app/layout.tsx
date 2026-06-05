import type { Metadata } from "next";
// @ts-ignore
import "./globals.css";

export const metadata: Metadata = {
  title: "Scouting & Performance Analytics Hub",
  description:
    "Plataforma de análisis de rendimiento y scouting de fútbol profesional",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <body className="bg-pitch-dark text-white antialiased">{children}</body>
    </html>
  );
}
