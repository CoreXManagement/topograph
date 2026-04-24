// Branding-Konfiguration aus Umgebungsvariablen
// Alle Werte sind optional — Standardwerte wenn nicht gesetzt

export interface Branding {
  appName: string;
  logoUrl: string | null;
  primaryColor: string;
  primaryColorForeground: string;
}

export function getBranding(): Branding {
  return {
    appName:                process.env.NEXT_PUBLIC_APP_NAME ?? "Topograph",
    logoUrl:                process.env.NEXT_PUBLIC_LOGO_URL ?? null,
    primaryColor:           process.env.NEXT_PUBLIC_PRIMARY_COLOR ?? "#6366f1",
    primaryColorForeground: process.env.NEXT_PUBLIC_PRIMARY_COLOR_FG ?? "#ffffff",
  };
}
