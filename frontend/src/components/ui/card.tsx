import * as React from "react";
import { cn } from "../../lib/utils";

type CardVariant = "default" | "accent" | "hero" | "ghost";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  /** @deprecated use variant instead */
  glow?: string;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", style, ...props }, ref) => {
    const variantStyles: Record<CardVariant, React.CSSProperties> = {
      default: {
        background: "#181818",
        border: "1px solid rgba(245,242,234,0.07)",
        boxShadow: "0 1px 2px rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.3)",
      },
      accent: {
        background: "rgba(15,107,80,0.07)",
        border: "1px solid rgba(15,107,80,0.22)",
        boxShadow: "0 1px 2px rgba(0,0,0,0.3)",
      },
      hero: {
        background: "rgba(200,139,58,0.06)",
        border: "1px solid rgba(200,139,58,0.20)",
        boxShadow: "0 2px 4px rgba(0,0,0,0.4)",
      },
      ghost: {
        background: "rgba(245,242,234,0.025)",
        border: "1px solid rgba(245,242,234,0.06)",
        boxShadow: "none",
      },
    };

    // backwards compat with old glow prop
    const glowProp = (props as any).glow;
    const effectiveVariant = glowProp ? (glowProp === "gold" ? "accent" : "accent") : variant;

    return (
      <div
        ref={ref}
        className={cn("rounded-2xl", className)}
        style={{ ...variantStyles[effectiveVariant], ...style }}
        {...props}
      />
    );
  }
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-5 pb-0", className)} {...props} />
  )
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("font-display font-bold text-lg text-white leading-tight", className)} {...props} />
  )
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm text-slate-400 mt-1", className)} {...props} />
  )
);
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-5", className)} {...props} />
  )
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-5 pt-0 flex items-center", className)} {...props} />
  )
);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
