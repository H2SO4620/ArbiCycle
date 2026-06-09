import * as React from "react";
import { cn } from "../../lib/utils";

const Separator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { orientation?: "horizontal" | "vertical" }
>(({ className, orientation = "horizontal", ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
      className
    )}
    style={{ background: "rgba(255,255,255,0.07)" }}
    {...props}
  />
));
Separator.displayName = "Separator";

export { Separator };
