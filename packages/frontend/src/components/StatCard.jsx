import React from "react";
import { Card } from "./Card";

export function StatCard({ label, value, icon, trend }) {
  return (
    <Card padding="md" className="flex items-start justify-between">
      <div>
        <p className="text-sm text-[#6B7280] mb-2">{label}</p>
        <p className="text-3xl text-[#1F2937] leading-none mb-2">{value}</p>
        {trend ? <p className="text-sm text-[#6B7280]">{trend}</p> : null}
      </div>
      <div className="text-[#E07A5F] opacity-90">{icon}</div>
    </Card>
  );
}
