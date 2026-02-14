import React from "react";

export function Card({ children, className = "", padding = "md" }) {
  const pad =
    padding === "lg" ? "p-6 sm:p-8" : padding === "sm" ? "p-3" : "p-4 sm:p-5";

  return (
    <div
      className={[
        "rounded-2xl bg-white border border-[rgba(31,41,55,0.08)] shadow-sm",
        pad,
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}
