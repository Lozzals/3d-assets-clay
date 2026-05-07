import { AssetLibrary } from "@/components/desktop/AssetLibrary";
import { Minus, Square, X } from "lucide-react";
import wallpaper from "@/assets/wallpaper.webp";

const Index = () => {
  const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return (
    <div
      className="fixed inset-0 flex flex-col overflow-hidden bg-cover bg-center p-4 pb-12"
      style={{ backgroundImage: `url(${wallpaper})` }}
    >
      {/* Window */}
      <div className="os-window mx-auto flex h-full w-full max-w-[1400px] flex-col overflow-hidden">
        {/* Titlebar */}
        <div className="os-titlebar flex h-8 select-none items-center justify-between px-2">
          <div className="flex-1" />
          <div className="flex items-center gap-1.5 rounded border border-window-border bg-window px-3 py-0.5 text-[11px] font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            Asset Library
          </div>
          <div className="flex flex-1 items-center justify-end gap-1">
            <button className="os-btn-square" aria-label="Minimize"><Minus className="h-2.5 w-2.5" /></button>
            <button className="os-btn-square" aria-label="Maximize"><Square className="h-2 w-2" /></button>
            <button className="os-btn-square hover:!bg-destructive hover:!text-destructive-foreground" aria-label="Close"><X className="h-2.5 w-2.5" /></button>
          </div>
        </div>
        <div className="relative flex-1 overflow-hidden bg-window">
          <AssetLibrary />
        </div>
      </div>

      {/* Taskbar */}
      <div className="absolute bottom-0 left-0 right-0 z-50 flex h-9 items-center justify-between border-t border-window-border bg-window px-2">
        <div className="flex items-center gap-2">
          <button className="os-tab !rounded-md !pb-1">
            <span className="font-mono text-[11px] tracking-widest">START</span>
          </button>
          <button className="os-tab !rounded-md !pb-1">
            <span className="text-[11px]">🖼</span>
            <span className="text-[11px]">Wallpaper</span>
          </button>
        </div>
        <button className="os-tab !rounded-md !pb-1">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          <span className="text-[11px]">Asset Library</span>
        </button>
        <div className="flex items-center gap-3 pr-1 text-[11px]">{time}</div>
      </div>
    </div>
  );
};

export default Index;
