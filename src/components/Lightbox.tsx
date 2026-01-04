import { useEffect } from "react";

export type LightboxProps = {
  isOpen: boolean;
  onClose: () => void;
  zIndex?: number;
};

export default function Lightbox({ isOpen, onClose, zIndex }: LightboxProps) {
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

  const baseZ = zIndex ?? 1000;

  return (
    <>
      <div
        role="presentation"
        onClick={onClose}
        onContextMenu={(e) => e.preventDefault()}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.85)",
          zIndex: baseZ,
        }}
      />
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        style={{
          position: "fixed",
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
    </>
  );
}
