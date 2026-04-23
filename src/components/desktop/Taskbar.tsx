interface Props {
  openWindows: { id: string; title: string }[];
  onActivate: (id: string) => void;
}

export const Taskbar = ({ openWindows, onActivate }: Props) => {
  const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return (
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
      <div className="flex items-center gap-2">
        {openWindows.map((w) => (
          <button key={w.id} onClick={() => onActivate(w.id)} className="os-tab !rounded-md !pb-1">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            <span className="text-[11px]">{w.title}</span>
          </button>
        ))}
      </div>
      <div className="flex items-center gap-3 pr-1 text-[11px]">
        <span>{time}</span>
      </div>
    </div>
  );
};