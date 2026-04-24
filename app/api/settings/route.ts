import { NextResponse } from "next/server";
import { ensureSchema, getSetting } from "@/lib/db";

// Öffentlich — kein Auth nötig (nur nicht-sensitive Werte)
export async function GET() {
  await ensureSchema();
  const appName = await getSetting("app_name");
  return NextResponse.json({ app_name: appName ?? "Topograph" });
}
