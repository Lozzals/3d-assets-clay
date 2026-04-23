interface Props {
  color: "pink" | "purple" | "blue" | "green" | "yellow" | "orange" | "teal" | "coral";
  variant?: "folder" | "doc" | "controller" | "asset";
}

const COLOR_VAR: Record<Props["color"], string> = {
  pink: "var(--folder-pink)",
  purple: "var(--folder-purple)",
  blue: "var(--folder-blue)",
  green: "var(--folder-green)",
  yellow: "var(--folder-yellow)",
  orange: "var(--folder-orange)",
  teal: "var(--folder-teal)",
  coral: "var(--folder-coral)",
};

export const PixelFolder = ({ color, variant = "folder" }: Props) => {
  const fill = `hsl(${COLOR_VAR[color]})`;
  const dark = `hsl(${COLOR_VAR[color]} / 0.55)`;
  const stroke = "hsl(var(--window-border))";

  if (variant === "doc") {
    return (
      <svg viewBox="0 0 32 32" className="pixelated h-12 w-12" shapeRendering="crispEdges">
        <rect x="6" y="3" width="18" height="26" fill="hsl(var(--window))" stroke={stroke} strokeWidth="1.5" />
        <rect x="9" y="8" width="12" height="1.5" fill={stroke} opacity="0.6" />
        <rect x="9" y="11" width="12" height="1.5" fill={stroke} opacity="0.6" />
        <rect x="9" y="14" width="9" height="1.5" fill={stroke} opacity="0.6" />
        <rect x="9" y="17" width="12" height="1.5" fill={stroke} opacity="0.6" />
        <rect x="9" y="20" width="7" height="1.5" fill={stroke} opacity="0.6" />
      </svg>
    );
  }

  if (variant === "controller") {
    return (
      <svg viewBox="0 0 32 32" className="pixelated h-12 w-12" shapeRendering="crispEdges">
        <rect x="3" y="11" width="26" height="12" rx="6" fill={fill} stroke={stroke} strokeWidth="1.5" />
        <rect x="8" y="15" width="2" height="4" fill={stroke} />
        <rect x="6" y="17" width="6" height="2" fill={stroke} />
        <circle cx="22" cy="16" r="1.4" fill={stroke} />
        <circle cx="25" cy="19" r="1.4" fill={stroke} />
      </svg>
    );
  }

  if (variant === "asset") {
    return (
      <svg viewBox="0 0 32 32" className="pixelated h-12 w-12" shapeRendering="crispEdges">
        <rect x="5" y="13" width="10" height="3" fill={fill} stroke={stroke} strokeWidth="1.2" />
        <rect x="17" y="13" width="10" height="3" fill={fill} stroke={stroke} strokeWidth="1.2" />
        <rect x="11" y="18" width="10" height="3" fill={fill} stroke={stroke} strokeWidth="1.2" />
      </svg>
    );
  }

  // folder
  return (
    <svg viewBox="0 0 32 32" className="pixelated h-12 w-12" shapeRendering="crispEdges">
      <path d="M3 9 H12 L14 12 H29 V26 H3 Z" fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinejoin="miter" />
      <path d="M3 13 H29" stroke={dark} strokeWidth="1" />
    </svg>
  );
};