import { useState } from "react";
import { DesktopIcon } from "@/components/desktop/DesktopIcon";
import { Window } from "@/components/desktop/Window";
import { Taskbar } from "@/components/desktop/Taskbar";
import { AssetLibrary } from "@/components/desktop/AssetLibrary";
import { LoreWindow } from "@/components/desktop/LoreWindow";
import { PlaceholderWindow } from "@/components/desktop/PlaceholderWindow";

type WindowId = "lore" | "assets" | "map" | "village" | "underworld" | "baked" | "characters" | "concept" | "games";

interface OpenWin {
  id: WindowId;
  title: string;
  z: number;
}

const ICONS: { id: WindowId; label: string; color: Parameters<typeof DesktopIcon>[0]["color"]; variant?: Parameters<typeof DesktopIcon>[0]["variant"] }[] = [
  { id: "map", label: "The Map", color: "yellow" },
  { id: "assets", label: "Asset Library", color: "coral", variant: "asset" },
  { id: "village", label: "Sonic Village", color: "purple" },
  { id: "games", label: "Games", color: "green", variant: "controller" },
  { id: "underworld", label: "Underworld", color: "blue" },
  { id: "baked", label: "Baked Nation", color: "orange" },
  { id: "characters", label: "Characters", color: "pink" },
  { id: "concept", label: "Concept Art", color: "teal" },
  { id: "lore", label: "Lore.txt", color: "blue", variant: "doc" },
];

const TITLES: Record<WindowId, string> = {
  lore: "Lore.txt",
  assets: "Asset Library",
  map: "The Map",
  village: "Sonic Village",
  underworld: "Underworld",
  baked: "Baked Nation",
  characters: "Characters",
  concept: "Concept Art",
  games: "Games",
};

const Index = () => {
  const [open, setOpen] = useState<OpenWin[]>([
    { id: "lore", title: "Lore.txt", z: 10 },
  ]);
  const [selected, setSelected] = useState<WindowId | null>(null);
  const [topZ, setTopZ] = useState(10);

  const openWindow = (id: WindowId) => {
    setOpen((prev) => {
      if (prev.find((w) => w.id === id)) {
        const newZ = topZ + 1;
        setTopZ(newZ);
        return prev.map((w) => (w.id === id ? { ...w, z: newZ } : w));
      }
      const newZ = topZ + 1;
      setTopZ(newZ);
      return [...prev, { id, title: TITLES[id], z: newZ }];
    });
  };

  const closeWindow = (id: WindowId) => setOpen((prev) => prev.filter((w) => w.id !== id));

  const focusWindow = (id: WindowId) => {
    const newZ = topZ + 1;
    setTopZ(newZ);
    setOpen((prev) => prev.map((w) => (w.id === id ? { ...w, z: newZ } : w)));
  };

  return (
    <div className="desktop-bg fixed inset-0 overflow-hidden">
      {/* Desktop icons grid */}
      <div className="absolute left-4 top-4 grid grid-cols-2 gap-x-2 gap-y-3">
        {ICONS.map((ic) => (
          <DesktopIcon
            key={ic.id}
            label={ic.label}
            color={ic.color}
            variant={ic.variant}
            selected={selected === ic.id}
            onClick={() => setSelected(ic.id)}
            onDoubleClick={() => openWindow(ic.id)}
          />
        ))}
      </div>

      {/* Open windows */}
      {open.map((w, idx) => {
        const initial =
          w.id === "assets"
            ? { x: 220, y: 40, w: Math.min(1080, window.innerWidth - 260), h: Math.min(720, window.innerHeight - 100) }
            : w.id === "lore"
            ? { x: 380, y: 90, w: 460, h: 380 }
            : { x: 240 + idx * 30, y: 80 + idx * 30, w: 520, h: 380 };
        return (
          <Window
            key={w.id}
            title={w.title}
            initial={initial}
            zIndex={w.z}
            onClose={() => closeWindow(w.id)}
            onFocus={() => focusWindow(w.id)}
          >
            {w.id === "assets" && <AssetLibrary />}
            {w.id === "lore" && <LoreWindow />}
            {w.id !== "assets" && w.id !== "lore" && <PlaceholderWindow title={w.title} />}
          </Window>
        );
      })}

      <Taskbar
        openWindows={open.map((w) => ({ id: w.id, title: w.title }))}
        onActivate={(id) => focusWindow(id as WindowId)}
      />
    </div>
  );
};

export default Index;
