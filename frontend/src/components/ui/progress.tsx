import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "../../lib/utils";

const colorMap: Record<string, { gradient: string; glow: string }> = {
  emerald: {
    gradient: "linear-gradient(90deg, #17A77A, #0F6B50)",
    glow: "0 0 8px rgba(23,167,122,0.45)",
  },
  gold: {
    gradient: "linear-gradient(90deg, #E8A84A, #C88B3A)",
    glow: "0 0 8px rgba(200,139,58,0.45)",
  },
  // legacy alias
  teal: {
    gradient: "linear-gradient(90deg, #17A77A, #0F6B50)",
    glow: "0 0 8px rgba(23,167,122,0.45)",
  },
};

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & {
    color?: "emerald" | "gold" | "teal";
  }
>(({ className, value, color = "emerald", ...props }, ref) => {
  const c = colorMap[color] ?? colorMap.emerald;
  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full",
        className
      )}
      style={{ background: "rgba(245,242,234,0.07)" }}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className="h-full w-full flex-1 rounded-full transition-all duration-500"
        style={{
          transform: `translateX(-${100 - (value || 0)}%)`,
          background: c.gradient,
          boxShadow: c.glow,
        }}
      />
    </ProgressPrimitive.Root>
  );
});
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
