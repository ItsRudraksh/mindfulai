"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface GlowingEffectProps {
  spread?: number;
  glow?: boolean;
  disabled?: boolean;
  proximity?: number;
  inactiveZone?: number;
  borderWidth?: number;
  className?: string;
}

export function GlowingEffect({
  spread = 40,
  glow = true,
  disabled = false,
  proximity = 64,
  inactiveZone = 0.01,
  borderWidth = 3,
  className,
}: GlowingEffectProps) {
  const [isHovered, setIsHovered] = React.useState(false);
  const [mousePosition, setMousePosition] = React.useState({ x: 0, y: 0 });
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (disabled) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Check if mouse is within proximity
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
      const maxDistance = Math.sqrt(Math.pow(rect.width / 2, 2) + Math.pow(rect.height / 2, 2));
      
      if (distance <= proximity) {
        setIsHovered(true);
        setMousePosition({ x, y });
      } else {
        setIsHovered(false);
      }
    };

    const handleMouseLeave = () => {
      setIsHovered(false);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
      container.addEventListener('mouseleave', handleMouseLeave);
    }

    return () => {
      if (container) {
        container.removeEventListener('mousemove', handleMouseMove);
        container.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, [disabled, proximity]);

  if (disabled) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "absolute inset-0 pointer-events-none overflow-hidden rounded-[inherit]",
        className
      )}
    >
      {/* Glowing border effect */}
      <div
        className={cn(
          "absolute inset-0 rounded-[inherit] transition-opacity duration-300",
          isHovered && glow ? "opacity-100" : "opacity-0"
        )}
        style={{
          background: isHovered
            ? `radial-gradient(${spread}px circle at ${mousePosition.x}px ${mousePosition.y}px, 
                hsl(var(--primary) / 0.3) 0%, 
                hsl(var(--primary) / 0.1) 40%, 
                transparent 70%)`
            : "transparent",
          padding: `${borderWidth}px`,
          mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          maskComposite: "xor",
          WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor",
        }}
      />

      {/* Inner glow effect */}
      {isHovered && glow && (
        <div
          className="absolute inset-0 rounded-[inherit] transition-opacity duration-300"
          style={{
            background: `radial-gradient(${spread * 0.8}px circle at ${mousePosition.x}px ${mousePosition.y}px, 
              hsl(var(--primary) / 0.1) 0%, 
              transparent 60%)`,
            opacity: 0.6,
          }}
        />
      )}
    </div>
  );
}