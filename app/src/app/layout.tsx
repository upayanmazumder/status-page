import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "../components/Auth/AuthProvider/AuthProvider";
import Header from "../components/Header/Header";

export const metadata: Metadata = {
  title: "Status Page",
  description: "Monitor your services with real-time updates and alerts.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body>
        <Header />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
