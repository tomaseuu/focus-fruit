import React, { useEffect } from "react";
import { Card } from "./Card";
import { Button } from "./Button";

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  onSubmit,
  submitText = "Done",
}) {
  useEffect(() => {
    if (!isOpen) return;

    function onKey(e) {
      if (e.key === "Escape") onClose?.();
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
    >
      {/* backdrop */}
      <button
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
        aria-label="Close modal"
      />

      {/* content */}
      <div className="relative w-full max-w-lg">
        <Card padding="lg">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h2 className="text-xl text-[#1F2937]">{title}</h2>
              <p className="text-sm text-[#6B7280] mt-1">
                Quick reflection to close the loop.
              </p>
            </div>

            <Button variant="ghost" onClick={onClose}>
              ✕
            </Button>
          </div>

          <div className="mb-6">{children}</div>

          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" onClick={onSubmit}>
              {submitText}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
