import React from "react";

const tagStyles = {
  Work: "bg-purple-50 text-purple-700 border-purple-200",
  Health: "bg-green-50 text-green-700 border-green-200",
  Creative: "bg-pink-50 text-pink-700 border-pink-200",
  School: "bg-blue-50 text-blue-700 border-blue-200",
  All: "bg-[#FAF7F2] text-[#1F2937] border-[rgba(31,41,55,0.12)]",
};

export function TagChip({ label, active = false, onClick }) {
  const clickable = typeof onClick === "function";

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "px-3 py-1 rounded-full border text-sm whitespace-nowrap transition-colors",
        active
          ? "bg-[#E07A5F] text-white border-[#E07A5F]"
          : tagStyles[label] ?? tagStyles.All,
        clickable ? "hover:opacity-90" : "cursor-default",
      ].join(" ")}
    >
      {label}
    </button>
  );
}
