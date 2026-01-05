import { useEffect } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";

export type LightboxProps = {
  isOpen: boolean;
  onClose: () => void;
  zIndex?: number;
  children?: ReactNode;
};

export default function Lightbox({
  isOpen,
  onClose,
  zIndex,
  children,
}: LightboxProps) {
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  if (typeof document === "undefined") return null;

  const baseZ = zIndex ?? 1000;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      onContextMenu={(e) => e.preventDefault()}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: baseZ,
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.85)",
        }}
      />

      {children ? (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            boxSizing: "border-box",
            zIndex: baseZ + 1,
          }}
        >
          {children}
        </div>
      ) : null}

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        aria-label="Close"
        style={{
          position: "absolute",
          top: "12px",
          right: "12px",
          width: "40px",
          height: "40px",
          borderRadius: "999px",
          border: "1px solid rgba(255,255,255,0.25)",
          background: "rgba(0,0,0,0.4)",
          color: "white",
          cursor: "pointer",
          fontSize: "20px",
          lineHeight: "40px",
          padding: 0,
          zIndex: baseZ + 2,
        }}
      >
        ×
      </button>
    </div>,
    document.body
  );
}
