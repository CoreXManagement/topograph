import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { getBranding } from "@/lib/branding";

export function generateMetadata(): Metadata {
  const b = getBranding();
  return {
    title: b.appName,
    description: "Visuelle Systemdokumentation & Topologie",
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const b = getBranding();
  const primaryHex = b.primaryColor;

  // Primärfarbe als CSS-Variable injizieren (konvertiere Hex → HSL für Tailwind)
  const cssVars = primaryHex.startsWith("#")
    ? `--primary-hex: ${primaryHex};`
    : "";

  return (
    <html lang="de" className="dark">
      <head>
        {cssVars && <style>{`:root { ${cssVars} }`}</style>}
        {b.logoUrl && <link rel="icon" href={b.logoUrl} />}
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
