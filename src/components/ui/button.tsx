/**
 * button.tsx
 * 3D Glassmorphism Button Component
 */

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

// 🔧 FIX: 다크모드 초기값 동기 설정 (깜빡임 방지)
const getInitialDarkMode = () =>
  typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

// Glassmorphism base styles
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // Default: Dark solid button (monochrome)
        default: "",
        // Destructive: Keep for compatibility
        destructive: "",
        // Outline: Glass border button
        outline: "",
        // Secondary: Subtle glass button
        secondary: "",
        // Ghost: Transparent hover effect
        ghost: "",
        // Link: Text link style
        link: "underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-11 px-8",
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
  ({ className, variant, size, asChild = false, style, ...props }, ref) => {
    const [isDark, setIsDark] = React.useState(getInitialDarkMode);

    React.useEffect(() => {
      const check = () => setIsDark(document.documentElement.classList.contains('dark'));
      const obs = new MutationObserver(check);
      obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
      return () => obs.disconnect();
    }, []);

    const Comp = asChild ? Slot : "button";

    // Get variant-specific styles
    const getVariantStyle = (): React.CSSProperties => {
      switch (variant) {
        case 'default':
          return {
            background: isDark
              ? 'linear-gradient(145deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.1) 100%)'
              : 'linear-gradient(145deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.85) 50%, rgba(0,0,0,0.88) 100%)',
            border: isDark ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(0,0,0,0.1)',
            color: '#ffffff',
            boxShadow: isDark
              ? 'inset 0 1px 1px rgba(255,255,255,0.1), 0 4px 12px rgba(0,0,0,0.3)'
              : '0 2px 4px rgba(0,0,0,0.1), 0 4px 8px rgba(0,0,0,0.08)',
          };
        case 'destructive':
          return {
            background: isDark
              ? 'linear-gradient(145deg, rgba(220,50,50,0.8) 0%, rgba(180,30,30,0.9) 100%)'
              : 'linear-gradient(145deg, rgba(220,50,50,0.9) 0%, rgba(180,30,30,0.95) 100%)',
            border: '1px solid rgba(220,50,50,0.3)',
            color: '#ffffff',
            boxShadow: '0 2px 4px rgba(220,50,50,0.2), 0 4px 8px rgba(220,50,50,0.15)',
          };
        case 'outline':
          return {
            background: isDark
              ? 'rgba(255,255,255,0.05)'
              : 'rgba(0,0,0,0.02)',
            border: isDark ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(0,0,0,0.1)',
            color: isDark ? '#ffffff' : '#1a1a1f',
            boxShadow: isDark
              ? 'inset 0 1px 1px rgba(255,255,255,0.05)'
              : '0 1px 2px rgba(0,0,0,0.04)',
          };
        case 'secondary':
          return {
            background: isDark
              ? 'linear-gradient(145deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.04) 100%)'
              : 'linear-gradient(145deg, rgba(0,0,0,0.06) 0%, rgba(0,0,0,0.03) 100%)',
            border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.06)',
            color: isDark ? '#ffffff' : '#1a1a1f',
            boxShadow: isDark
              ? 'inset 0 1px 1px rgba(255,255,255,0.08)'
              : '0 1px 2px rgba(0,0,0,0.03)',
          };
        case 'ghost':
          return {
            background: 'transparent',
            border: '1px solid transparent',
            color: isDark ? 'rgba(255,255,255,0.7)' : '#515158',
          };
        case 'link':
          return {
            background: 'transparent',
            border: 'none',
            color: isDark ? '#ffffff' : '#1a1a1f',
            boxShadow: 'none',
          };
        default:
          return {};
      }
    };

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        style={{
          ...getVariantStyle(),
          ...style,
        }}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
