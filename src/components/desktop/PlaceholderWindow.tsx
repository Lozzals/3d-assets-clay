export const PlaceholderWindow = ({ title }: { title: string }) => (
  <div className="flex h-full flex-col items-center justify-center gap-3 bg-window p-8 text-center">
    <div className="text-4xl">📁</div>
    <div className="text-[13px] font-semibold">{title}</div>
    <p className="max-w-xs text-[11px] text-muted-foreground">
      This folder is empty for now. Open the <span className="text-accent">Asset Library</span> to
      explore the full 3D collection.
    </p>
  </div>
);