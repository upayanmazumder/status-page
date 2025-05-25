import ProtectedRoute from "../../components/Auth/ProtectedRoute/ProtectedRoute";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
