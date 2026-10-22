import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium font-mono uppercase tracking-wider ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 rounded",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded",
        outline: "border border-border bg-transparent text-foreground hover:border-primary/60 hover:bg-accent hover:text-primary rounded-none",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded",
        ghost: "text-muted-foreground hover:bg-accent hover:text-foreground rounded",
        link: "text-foreground underline-offset-4 hover:underline",
        hero: "bg-primary text-primary-foreground hover:bg-primary/90 rounded-none font-bold shadow-[0_0_24px_-4px_hsl(var(--pumpkin)/0.7)] hover:shadow-[0_0_36px_-2px_hsl(var(--pumpkin)/0.9)]",
        nav: "text-muted-foreground hover:text-foreground hover:bg-accent rounded-none border-0 justify-start",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3 text-xs",
        lg: "h-12 px-8 text-sm",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
