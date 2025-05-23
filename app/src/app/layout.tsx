import type { Metadata } from "next";
import "./globals.css";
import Header from "../components/Header/Header";
import Footer from "../components/Footer/Footer";
import ServiceworkerRegister from "../components/ServiceworkerRegister/ServiceworkerRegister";
import { AuthProvider } from "../components/Auth/AuthProvider/AuthProvider";

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
        <AuthProvider>
          <Header />
          {children}
        </AuthProvider>
        <Footer />
        <ServiceworkerRegister />
      </body>
    </html>
  );
}
