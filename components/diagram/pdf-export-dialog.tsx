"use client";
import { useState, useEffect } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import type { ReactFlowInstance } from "@xyflow/react";

type Format = "portrait" | "landscape";
type Theme  = "dark" | "light" | "blueprint";

const A4 = {
  portrait:  { w: 210, h: 297 },
  landscape: { w: 297, h: 210 },
} as const;

const THEMES: Record<Theme, { label: string; desc: string; bg: string; preview: string }> = {
  dark:      { label: "Original",  desc: "So wie angezeigt",        bg: "#0a0d14", preview: "bg-zinc-950 border-zinc-700" },
  light:     { label: "Hell",      desc: "Weiß, druckoptimiert",    bg: "#ffffff", preview: "bg-white border-zinc-300" },
  blueprint: { label: "Blueprint", desc: "Navyblau, professionell", bg: "#0f172a", preview: "bg-slate-900 border-slate-600" },
};

function hexToRgb(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

interface Props {
  open: boolean;
  onClose: () => void;
  diagramTitle: string;
  rfInstance: ReactFlowInstance | null;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export function PdfExportDialog({ open, onClose, diagramTitle, rfInstance, containerRef }: Props) {
  const [format, setFormat]     = useState<Format>("landscape");
  const [theme, setTheme]       = useState<Theme>("dark");
  const [exporting, setExporting] = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [appName, setAppName]   = useState("Topograph");

  useEffect(() => {
    fetch("/api/settings").then((r) => r.ok ? r.json() : null).then((d) => {
      if (d?.app_name) setAppName(d.app_name);
    }).catch(() => {});
  }, []);

  async function handleExport() {
    if (!containerRef.current || !rfInstance) return;
    setExporting(true);
    setError(null);

    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);

      // Fit all nodes into view before capturing
      // Großzügigeres Padding verhindert Clipping an Node-Rändern
      rfInstance.fitView({ padding: 0.15, duration: 0 });
      await new Promise((r) => setTimeout(r, 600));

      const container = containerRef.current!;
      const themeCfg  = THEMES[theme];

      const canvas = await html2canvas(container, {
        backgroundColor: themeCfg.bg,
        scale: 2.5,
        useCORS: true,
        logging: false,
        ignoreElements: (el) =>
          el.classList.contains("react-flow__controls") ||
          el.classList.contains("react-flow__minimap") ||
          el.classList.contains("react-flow__panel"),
      });

      const dim    = A4[format];
      const margin = { top: 20, bottom: 14, side: 12 };
      const areaW  = dim.w - margin.side * 2;
      const areaH  = dim.h - margin.top - margin.bottom;

      // Scale image to fit the draw area while keeping aspect ratio
      const aspect = canvas.width / canvas.height;
      let imgW = areaW;
      let imgH = imgW / aspect;
      if (imgH > areaH) { imgH = areaH; imgW = imgH * aspect; }

      const imgX = margin.side + (areaW - imgW) / 2;
      const imgY = margin.top  + (areaH - imgH) / 2;

      const pdf = new jsPDF({ orientation: format, unit: "mm", format: "a4" });

      // Page background
      const [r, g, b] = hexToRgb(themeCfg.bg);
      pdf.setFillColor(r, g, b);
      pdf.rect(0, 0, dim.w, dim.h, "F");

      // Diagram
      pdf.addImage(canvas.toDataURL("image/png"), "PNG", imgX, imgY, imgW, imgH);

      // Header line
      const isLight   = theme === "light";
      const lineColor: [number, number, number] = isLight ? [209, 213, 219] : [63, 63, 70];
      const textColor: [number, number, number] = isLight ? [30,  30,  30]  : [228, 228, 231];
      const mutedColor: [number, number, number]= isLight ? [107, 114, 128] : [113, 113, 122];

      pdf.setDrawColor(...lineColor);
      pdf.setLineWidth(0.25);
      pdf.line(margin.side, 15, dim.w - margin.side, 15);

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      pdf.setTextColor(...textColor);
      pdf.text(diagramTitle, dim.w / 2, 10, { align: "center" });

      // Footer
      const footerY = dim.h - 6;
      pdf.line(margin.side, dim.h - 10, dim.w - margin.side, dim.h - 10);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7);
      pdf.setTextColor(...mutedColor);
      pdf.text(appName, margin.side, footerY);
      pdf.text(
        new Date().toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" }),
        dim.w - margin.side,
        footerY,
        { align: "right" }
      );

      const filename = `${diagramTitle.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") || "diagram"}.pdf`;
      pdf.save(filename);
      onClose();
    } catch (e) {
      console.error(e);
      setError("Export fehlgeschlagen. Bitte erneut versuchen.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>PDF exportieren</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-1">
          {/* Format */}
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Format</p>
            <div className="grid grid-cols-2 gap-2">
              {(["portrait", "landscape"] as Format[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  className={`flex flex-col items-center gap-2 rounded-lg border p-3 text-xs transition-all ${
                    format === f
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-zinc-700 text-zinc-400 hover:border-zinc-600"
                  }`}
                >
                  <div className={`border-2 border-current rounded-sm ${f === "portrait" ? "h-10 w-[28px]" : "h-[28px] w-10"}`} />
                  {f === "portrait" ? "A4 Hochformat" : "A4 Querformat"}
                </button>
              ))}
            </div>
          </div>

          {/* Theme */}
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Design</p>
            <div className="grid grid-cols-3 gap-2">
              {(Object.entries(THEMES) as [Theme, (typeof THEMES)[Theme]][]).map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => setTheme(key)}
                  className={`flex flex-col items-center gap-1.5 rounded-lg border p-2.5 text-xs transition-all ${
                    theme === key
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-zinc-700 text-zinc-400 hover:border-zinc-600"
                  }`}
                >
                  {/* Mini preview */}
                  <div className={`h-9 w-full rounded border ${cfg.preview} flex items-center justify-center gap-1 overflow-hidden`}>
                    <div className="h-3 w-4 rounded-sm border border-cyan-500/50 bg-cyan-500/20" />
                    <div className="h-px w-3 bg-zinc-500" />
                    <div className="h-3 w-4 rounded-sm border border-amber-500/50 bg-amber-500/20" />
                  </div>
                  <span className="font-medium">{cfg.label}</span>
                  <span className="text-[9px] opacity-60 text-center leading-tight">{cfg.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={exporting}>Abbrechen</Button>
          <Button onClick={handleExport} disabled={exporting || !rfInstance} className="gap-1.5">
            {exporting
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Exportiere...</>
              : <><Download className="h-4 w-4" /> PDF erstellen</>
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
