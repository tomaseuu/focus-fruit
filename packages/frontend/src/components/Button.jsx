import React from "react";

export function Button({
  children,
  className = "",
  variant = "primary", // primary | secondary | ghost
  size = "md", // sm | md | lg
  ...props
}) {
  const base =
    "inline-flex items-center justify-center rounded-2xl font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#E07A5F] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const sizes = {
    sm: "text-sm px-3 py-2",
    md: "text-sm px-4 py-3",
    lg: "text-base px-5 py-3.5",
  };

  const variants = {
    primary: "bg-[#E07A5F] text-white hover:opacity-95",
    secondary:
      "bg-[#F2E9E4] text-[#1F2937] hover:bg-[#eadfd8] border border-[rgba(31,41,55,0.08)]",
    ghost: "bg-transparent text-[#1F2937] hover:bg-[#FAF7F2]",
  };

  return (
    <button
      className={[base, sizes[size], variants[variant], className].join(" ")}
      {...props}
    >
      {children}
    </button>
  );
}
