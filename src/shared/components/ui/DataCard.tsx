"use client";

import { type ReactNode } from "react";

type CardVariant = "default" | "glass";
type CardPadding = "sm" | "md" | "lg";

interface DataCardProps {
  children: ReactNode;
  variant?: CardVariant;
  padding?: CardPadding;
  className?: string;
  onClick?: () => void;
}

const paddingMap: Record<CardPadding, string> = {
  sm: "p-3",
  md: "p-5",
  lg: "p-6 md:p-8",
};

export default function DataCard({
  children,
  variant = "default",
  padding = "md",
  className = "",
  onClick,
}: DataCardProps) {
  const base =
    variant === "glass" ? "data-card-glass" : "data-card";
  const cursor = onClick ? "cursor-pointer" : "";

  return (
    <div
      className={`${base} ${paddingMap[padding]} ${cursor} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
