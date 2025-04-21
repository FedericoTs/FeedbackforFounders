import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Award, Star, Zap, TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const awardToastVariants = cva(
  "group fixed flex w-full max-w-sm items-center justify-between space-x-4 overflow-hidden rounded-lg border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full",
  {
    variants: {
      variant: {
        default:
          "border-slate-200 bg-white text-slate-950 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50",
        achievement:
          "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800/30 dark:bg-amber-900/20 dark:text-amber-50",
        streak:
          "border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-800/30 dark:bg-blue-900/20 dark:text-blue-50",
        level:
          "border-purple-200 bg-purple-50 text-purple-900 dark:border-purple-800/30 dark:bg-purple-900/20 dark:text-purple-50",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const iconVariants = cva(
  "h-10 w-10 rounded-full flex items-center justify-center",
  {
    variants: {
      variant: {
        default:
          "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-50",
        achievement:
          "bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-50",
        streak:
          "bg-blue-100 text-blue-900 dark:bg-blue-900/30 dark:text-blue-50",
        level:
          "bg-purple-100 text-purple-900 dark:bg-purple-900/30 dark:text-purple-50",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const pointsVariants = cva("text-sm font-medium", {
  variants: {
    variant: {
      default: "text-slate-900 dark:text-slate-50",
      achievement: "text-amber-900 dark:text-amber-50",
      streak: "text-blue-900 dark:text-blue-50",
      level: "text-purple-900 dark:text-purple-50",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

interface AwardToastProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof awardToastVariants> {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title: string;
  description: string;
  points: number;
}

const AwardToast = React.forwardRef<HTMLDivElement, AwardToastProps>(
  (
    {
      className,
      variant,
      open,
      onOpenChange,
      title,
      description,
      points,
      ...props
    },
    ref,
  ) => {
    const [isVisible, setIsVisible] = React.useState(open);

    React.useEffect(() => {
      setIsVisible(open);
      if (open) {
        const timer = setTimeout(() => {
          setIsVisible(false);
          onOpenChange?.(false);
        }, 5000);
        return () => clearTimeout(timer);
      }
    }, [open, onOpenChange]);

    const handleClose = () => {
      setIsVisible(false);
      onOpenChange?.(false);
    };

    const getIcon = () => {
      switch (variant) {
        case "achievement":
          return <Star className="h-6 w-6" />;
        case "streak":
          return <Zap className="h-6 w-6" />;
        case "level":
          return <TrendingUp className="h-6 w-6" />;
        default:
          return <Award className="h-6 w-6" />;
      }
    };

    return (
      <AnimatePresence>
        {isVisible && (
          <motion.div
            ref={ref}
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className={cn(
              awardToastVariants({ variant }),
              "z-50 top-4 right-4",
              className,
            )}
            {...props}
          >
            <div className="flex items-center gap-4">
              <div className={cn(iconVariants({ variant }))}>{getIcon()}</div>
              <div className="grid gap-1">
                <div className="flex items-center">
                  <h4 className="font-semibold text-base">{title}</h4>
                  <div className="ml-2 flex items-center">
                    <span className={cn(pointsVariants({ variant }))}>
                      +{points}
                    </span>
                  </div>
                </div>
                <p className="text-sm opacity-90">{description}</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="absolute right-2 top-2 rounded-md p-1 text-slate-500 opacity-70 transition-opacity hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100 dark:text-slate-400"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    );
  },
);

AwardToast.displayName = "AwardToast";

export { AwardToast };
