import { useEffect, useMemo, useRef, useState } from "react";
import { ASSETS, CATEGORY_ICONS, MANIFEST_URL, type Asset } from "@/data/assets";
import { GlbPreview } from "@/components/GlbPreview";

// Files present in the R2 manifest but intentionally hidden from the library.
const EXCLUDED_FILES = new Set<string>([
  "pablito_hoverfly_baked_(1).glb",
  "pablito_sit_baked_(1).glb",
  "pablito_walk_baked_(1).glb",
]);

const tagClass = (t: Asset["t"]) => {
  switch (t) {
    case "glb":
      return "bg-[hsl(var(--tag-glb-bg))] text-[hsl(var(--tag-glb-fg))]";
    case "fbx":
      return "bg-[hsl(var(--tag-fbx-bg))] text-[hsl(var(--tag-fbx-fg))]";
    case "zip":
    case "rar":
      return "bg-[hsl(var(--tag-zip-bg))] text-[hsl(var(--tag-zip-fg))]";
    default:
      return "bg-[hsl(var(--tag-folder-bg))] text-[hsl(var(--tag-folder-fg))]";
  }
};

interface CardProps {
  asset: Asset;
}

const AssetCard = ({ asset }: CardProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setVisible(true);
            io.unobserve(el);
          }
        });
      },
      { rootMargin: "200px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
        className="flex flex-col overflow-hidden rounded-[4px] border border-window-border bg-window shadow-[2px_2px_0_0_hsl(var(--window-border)/0.25)] transition-transform hover:-translate-y-0.5"
    >
      <div className="relative aspect-square w-full border-b border-window-border bg-muted">
        {asset.t === "glb" && asset.f ? (
          <GlbPreview file={asset.f} enabled={visible} />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2">
            <span className="text-4xl opacity-60">{CATEGORY_ICONS[asset.c] || "📦"}</span>
            <span className={`rounded px-1.5 py-0.5 text-[9px] font-semibold tracking-wider ${tagClass(asset.t)}`}>
              {asset.t.toUpperCase()}
            </span>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1 px-2.5 py-2">
        <div className="text-[11px] font-medium leading-tight">{asset.n}</div>
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <span className={`rounded px-1.5 py-px text-[9px] font-semibold ${tagClass(asset.t)}`}>
            {asset.t.toUpperCase()}
          </span>
          <span>{asset.c}</span>
        </div>
      </div>
    </div>
  );
};

export const AssetLibrary = () => {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<string>("All");
  const [available, setAvailable] = useState<Set<string> | null>(null);

  useEffect(() => {
    fetch(MANIFEST_URL)
      .then((r) => r.json())
      .then((files: string[]) => {
        setAvailable(
          new Set(
            files
              .map((f) => f.toLowerCase())
              .filter((f) => !EXCLUDED_FILES.has(f))
          )
        );
      })
      .catch(() => setAvailable(new Set()));
  }, []);

  const categories = useMemo(() => ["All", ...Array.from(new Set(ASSETS.map((a) => a.c)))], []);

  const filtered = useMemo(() => {
    return ASSETS.filter((a) => {
      const matchCat = cat === "All" || a.c === cat;
      const q = query.trim().toLowerCase();
      const matchQ =
        !q ||
        a.n.toLowerCase().includes(q) ||
        a.c.toLowerCase().includes(q) ||
        (a.by ?? "").toLowerCase().includes(q);
      const inManifest =
        a.t !== "glb" || !available || available.size === 0 || (a.f && available.has(a.f.toLowerCase()));
      return matchCat && matchQ && inManifest;
    });
  }, [query, cat, available]);

  const grouped = useMemo(() => {
    const g: Record<string, Asset[]> = {};
    filtered.forEach((a) => {
      (g[a.c] = g[a.c] || []).push(a);
    });
    return g;
  }, [filtered]);

  const totalGlbs = ASSETS.filter((a) => a.t === "glb").length;
  const totalCats = new Set(ASSETS.map((a) => a.c)).size;

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-window-border bg-window-chrome/60 px-3 py-2">
        <div className="text-[12px] font-semibold">
          Clay Nation <span className="text-accent">Asset Library</span>
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, category…"
          className="ml-2 w-[220px] rounded-md border border-window-border bg-window px-2.5 py-1 text-[11px] outline-none focus:border-accent"
        />
        <div className="ml-auto text-[11px] text-muted-foreground">{filtered.length} assets</div>
      </div>

      {/* Stats */}
      <div className="flex flex-wrap gap-6 border-b border-window-border bg-window px-3 py-2">
        {[
          { n: ASSETS.length, l: "assets" },
          { n: totalGlbs, l: "3D models" },
          { n: totalCats, l: "categories" },
        ].map((s) => (
          <div key={s.l} className="flex flex-col">
            <span className="text-[18px] font-semibold leading-none text-accent">{s.n}</span>
            <span className="text-[9px] uppercase tracking-widest text-muted-foreground">{s.l}</span>
          </div>
        ))}
      </div>

      {/* Filters — pixel tabs */}
      <div className="flex flex-wrap items-end gap-1 border-b border-window-border bg-window-chrome/40 px-3 pt-2">
        {categories.map((c) => {
          const active = cat === c;
          return (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`os-tab !pb-1 ${
                active
                  ? "!bg-window translate-y-px font-semibold text-foreground"
                  : "!bg-window-chrome text-muted-foreground hover:!bg-window hover:text-foreground"
              }`}
              style={active ? { borderBottomColor: "hsl(var(--window))" } : undefined}
            >
              {c === "All" ? "All" : (
                <>
                  <span className="text-[11px]">{CATEGORY_ICONS[c] ?? ""}</span>
                  <span>{c}</span>
                </>
              )}
            </button>
          );
        })}
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-auto p-3">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-[12px] text-muted-foreground">No assets found</div>
        ) : (
          Object.entries(grouped).map(([c, items]) => (
            <section key={c} className="mb-5">
              {cat === "All" && (
                <div className="mb-2 border-b border-window-border pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {CATEGORY_ICONS[c] ?? ""} {c} · {items.length}
                </div>
              )}
              <div className="grid grid-cols-[repeat(auto-fill,minmax(170px,1fr))] gap-2.5">
                {items.map((a, i) => (
                  <AssetCard key={`${a.n}-${i}`} asset={a} />
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  );
};