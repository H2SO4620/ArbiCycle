import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        // primary brand variants
        emerald: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
        success: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
        gold:    "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20",
        warning: "bg-amber-500/10  text-amber-400  border border-amber-500/20",
        danger:  "bg-red-500/10    text-red-400    border border-red-500/20",
        subtle:  "bg-white/[0.05]  text-slate-400  border border-white/[0.08]",
        // legacy alias — kept so existing `variant="teal"` calls still compile
        // but now renders in emerald
        teal:    "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
        blue:    "bg-blue-500/10   text-blue-400   border border-blue-500/15",
      },
    },
    defaultVariants: { variant: "subtle" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
