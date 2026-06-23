"use client";

export default function Toast({ message }: { message: string }) {
  return (
    <div style={{
      position: "fixed", bottom: 24, left: "50%",
      transform: `translateX(-50%) translateY(${message ? 0 : 100}px)`,
      background: "var(--surface)",
      border: "1px solid var(--accent)",
      borderRadius: 11, padding: "10px 18px",
      fontSize: 13, fontWeight: 600, color: "var(--accent)",
      zIndex: 9999, transition: "transform .3s",
      whiteSpace: "nowrap", pointerEvents: "none",
    }}>
      {message}
    </div>
  );
}
