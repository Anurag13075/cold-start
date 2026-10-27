import React from "react";
import Link from "next/link";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  href?: string;
}

export function Logo({ className = "", size = "md", href = "/" }: LogoProps) {
  const iconSize = size === "lg" ? "w-8 h-8" : size === "sm" ? "w-5 h-5" : "w-6 h-6";
  const textSize = size === "lg" ? "text-xl" : size === "sm" ? "text-base" : "text-lg";

  const content = (
    <div className={`inline-flex items-center gap-2.5 font-bold ${className}`}>
      <div
        className={`${iconSize} rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm flex-shrink-0`}
      >
        <svg
          viewBox="0 0 24 24"
          className="w-4 h-4 fill-none stroke-current"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="12" y1="4" x2="12" y2="20" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <line x1="6.34" y1="6.34" x2="17.66" y2="17.66" />
          <line x1="6.34" y1="17.66" x2="17.66" y2="6.34" />
        </svg>
      </div>
      <span className={`${textSize} tracking-tight text-slate-900 font-semibold`}>
        Cold Start
      </span>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
