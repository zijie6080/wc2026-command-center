import { type ReactNode } from "react";

interface PageShellProps {
  children: ReactNode;
  maxWidth?: string;
  className?: string;
}

export default function PageShell({
  children,
  maxWidth = "max-w-[1600px]",
  className = "",
}: PageShellProps) {
  return (
    <div
      className={`mx-auto w-full px-4 md:px-6 lg:px-8 ${maxWidth} ${className}`}
    >
      {children}
    </div>
  );
}
