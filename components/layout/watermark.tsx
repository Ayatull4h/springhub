export default function Watermark() {
  return (
    <div
      className="fixed bottom-4 left-4 z-0 pointer-events-none select-none"
      aria-hidden="true"
    >
      <span
        className="text-[10px] sm:text-xs font-bold tracking-widest uppercase"
        style={{
          color: "rgba(148, 163, 184, 0.2)",
          textShadow: "0 0 4px rgba(0,0,0,0.05)",
          transform: "rotate(-45deg)",
          display: "inline-block",
          transformOrigin: "bottom left",
        }}
      >
        @jaga_semesta
      </span>
    </div>
  );
}
