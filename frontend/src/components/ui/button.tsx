import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 cursor-pointer",
  {
    variants: {
      variant: {
        default:     "text-[#080D1A] shadow-sm",
        outline:     "border border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.07] hover:border-white/20 hover:text-white",
        ghost:       "text-slate-400 hover:text-white hover:bg-white/[0.05]",
        destructive: "bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20",
        secondary:   "bg-white/[0.06] border border-white/[0.08] text-slate-300 hover:bg-white/[0.10] hover:text-white",
        gold:        "text-[#080D1A]",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm:      "h-8 px-3.5 text-xs",
        lg:      "h-12 px-7 text-base",
        icon:    "h-9 w-9 rounded-lg",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, style, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    const inlineStyle: React.CSSProperties =
      variant === "gold"
        ? { background: "linear-gradient(135deg, #FFD700 0%, #F59E0B 100%)", boxShadow: "0 0 20px rgba(255,215,0,0.2)", ...style }
        : (!variant || variant === "default")
        ? { background: "linear-gradient(135deg, #10E1FF 0%, #016BE5 100%)", boxShadow: "0 0 20px rgba(16,225,255,0.2)", ...style }
        : (style ?? {});

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        style={inlineStyle}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
