import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const pillButtonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-full border bg-clip-padding text-xs font-bold uppercase tracking-[0.05em] whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground border-transparent hover:bg-primary/80",
        secondary:
          "bg-secondary text-secondary-foreground border-transparent hover:bg-secondary/80",
        ghost: "bg-white text-foreground border-border hover:bg-muted",
        outline: "bg-white text-foreground border-foreground hover:bg-muted",
      },
      size: {
        default: "h-9 px-5 gap-2",
        sm: "h-8 px-4 gap-1.5 text-[10px]",
        lg: "h-10 px-6 gap-2",
        icon: "size-9 p-0",
        "icon-sm": "size-8 p-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

function PillButton({
  className,
  variant = "primary",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof pillButtonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="pill-button"
      className={cn(pillButtonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { PillButton, pillButtonVariants };
