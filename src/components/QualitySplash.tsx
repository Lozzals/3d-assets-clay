import { useQuality } from "@/lib/quality";

export const QualitySplash = () => {
  const { quality, setQuality } = useQuality();
  if (quality !== null) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
      <div className="os-window w-full max-w-md overflow-hidden">
        <div className="os-titlebar flex h-7 items-center px-2">
          <span className="text-[11px] font-semibold">Choose your experience</span>
        </div>
        <div className="bg-window p-5">
          <p className="mb-4 text-[12px] text-muted-foreground">
            Pick a graphics mode. You can switch any time from the toolbar.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setQuality("hd")}
              className="group flex flex-col items-start gap-2 rounded-[4px] border-2 border-window-border bg-window p-3 text-left transition-colors hover:border-accent hover:bg-accent/10"
            >
              <div className="flex w-full items-center justify-between">
                <span className="text-[14px] font-bold">HD</span>
                <span className="rounded bg-accent/20 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-accent">
                  Recommended
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground">
                Live 3D thumbnails. Best on desktop with a good GPU.
              </span>
            </button>
            <button
              onClick={() => setQuality("sd")}
              className="group flex flex-col items-start gap-2 rounded-[4px] border-2 border-window-border bg-window p-3 text-left transition-colors hover:border-accent hover:bg-accent/10"
            >
              <div className="flex w-full items-center justify-between">
                <span className="text-[14px] font-bold">Lite</span>
                <span className="rounded bg-muted px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Fast
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground">
                Icon thumbnails. 3D loads on hover. Great for phones and slow connections.
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};