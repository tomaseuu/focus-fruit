import React from "react";

export function Input({ label, className = "", ...props }) {
  return (
    <div className="space-y-2">
      {label ? (
        <label className="block text-sm text-[#6B7280]">{label}</label>
      ) : null}
      <input
        {...props}
        className={[
          "w-full px-4 py-3 bg-white border border-[rgba(31,41,55,0.08)]",
          "rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#E07A5F]",
          "text-[#1F2937] placeholder:text-[#9CA3AF]",
          className,
        ].join(" ")}
      />
    </div>
  );
}
