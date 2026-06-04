type DataSize = "lg" | "md" | "sm";

interface DataValueProps {
  value: string | number;
  size?: DataSize;
  accent?: boolean;
  muted?: boolean;
  className?: string;
}

export default function DataValue({
  value,
  size = "md",
  accent = false,
  muted = false,
  className = "",
}: DataValueProps) {
  const color = accent
    ? "text-[var(--accent-primary)]"
    : muted
      ? "text-[var(--text-muted)]"
      : "text-[var(--text-primary)]";

  return (
    <span className={`data-value-${size} ${color} ${className}`}>
      {value}
    </span>
  );
}
