import React, { memo, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface AnimatedGlowBorderProps {
  isActive: boolean;
  className?: string;
  duration?: number;
  colors?: string[];
  blur?: number;
  spread?: number;
  borderWidth?: number;
}

const AnimatedGlowBorder = memo(({
  isActive,
  className,
  duration = 4,
  colors = ["#dd7bbb", "#d79f1e", "#5a922c", "#4c7894"],
  blur = 0,
  spread = 20,
  borderWidth = 1
}: AnimatedGlowBorderProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const element = containerRef.current;
    const startTime = Date.now();

    const animate = () => {
      if (!isActive || !containerRef.current) return;

      const elapsed = Date.now() - startTime;
      const progress = (elapsed % (duration * 1000)) / (duration * 1000);
      const angle = progress * 360;

      element.style.setProperty("--start", String(angle));
      element.style.setProperty("--active", "1");

      animationRef.current = window.requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        window.cancelAnimationFrame(animationRef.current);
      }
      if (containerRef.current) {
        containerRef.current.style.setProperty("--active", "0");
      }
    };
  }, [isActive, duration]);

  const gradient = `radial-gradient(circle, ${colors[0] || "#dd7bbb"} 10%, ${colors[0] || "#dd7bbb"}00 20%),
    radial-gradient(circle at 40% 40%, ${colors[1] || "#d79f1e"} 5%, ${colors[1] || "#d79f1e"}00 15%),
    radial-gradient(circle at 60% 60%, ${colors[2] || "#5a922c"} 10%, ${colors[2] || "#5a922c"}00 20%), 
    radial-gradient(circle at 40% 60%, ${colors[3] || "#4c7894"} 10%, ${colors[3] || "#4c7894"}00 20%),
    repeating-conic-gradient(
      from 236.84deg at 50% 50%,
      ${colors[0] || "#dd7bbb"} 0%,
      ${colors[1] || "#d79f1e"} calc(25% / 5),
      ${colors[2] || "#5a922c"} calc(50% / 5), 
      ${colors[3] || "#4c7894"} calc(75% / 5),
      ${colors[0] || "#dd7bbb"} calc(100% / 5)
    )`;

  return (
    <div
      ref={containerRef}
      style={{
        "--blur": `${blur}px`,
        "--spread": spread,
        "--start": "0",
        "--active": "0",
        "--glowingeffect-border-width": `${borderWidth}px`,
        "--gradient": gradient,
      } as React.CSSProperties}
      className={cn(
        "pointer-events-none absolute inset-0 rounded-[inherit] opacity-100 transition-opacity",
        blur > 0 && "blur-[var(--blur)]",
        className
      )}
    >
      <div
        className={cn(
          "glow",
          "rounded-[inherit]",
          'after:content-[""] after:rounded-[inherit] after:absolute after:inset-[calc(-1*var(--glowingeffect-border-width))]',
          "after:[border:var(--glowingeffect-border-width)_solid_transparent]",
          "after:[background:var(--gradient)] after:[background-attachment:fixed]",
          "after:opacity-[var(--active)] after:transition-opacity after:duration-300",
          "after:[mask-clip:padding-box,border-box]",
          "after:[mask-composite:intersect]",
          "after:[mask-image:linear-gradient(#0000,#0000),conic-gradient(from_calc((var(--start)-var(--spread))*1deg),#00000000_0deg,#fff,#00000000_calc(var(--spread)*2deg))]"
        )}
      />
    </div>
  );
});

AnimatedGlowBorder.displayName = "AnimatedGlowBorder";

export { AnimatedGlowBorder };
