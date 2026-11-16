import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "Invitaciones · maap00.world", description: "Base técnica de invitaciones digitales personalizables.", robots: { index: false, follow: false } };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="es"><body>{children}</body></html>; }
