import { PixelFolder } from "./PixelFolder";

interface Props {
  label: string;
  color: "pink" | "purple" | "blue" | "green" | "yellow" | "orange" | "teal" | "coral";
  variant?: "folder" | "doc" | "controller" | "asset";
  selected?: boolean;
  onClick?: () => void;
  onDoubleClick?: () => void;
}

export const DesktopIcon = ({ label, color, variant, selected, onClick, onDoubleClick }: Props) => {
  return (
    <button
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      className={`group flex w-[78px] flex-col items-center gap-1.5 rounded-md p-1.5 transition-colors ${
        selected ? "bg-primary/10" : "hover:bg-primary/5"
      }`}
    >
      <PixelFolder color={color} variant={variant} />
      <span className="desktop-icon-label max-w-[74px] break-words">{label}</span>
    </button>
  );
};