import React, {
  useState,
  useCallback,
  createContext,
  useContext,
  useRef,
} from "react";
import { AwardToast } from "@/components/ui/award-toast";

type AwardToastVariant =
  | "default"
  | "achievement"
  | "streak"
  | "level"
  | "feedback";

interface AwardToastOptions {
  title: string;
  description: string;
  points: number;
  variant?: AwardToastVariant;
}

interface AwardToastContextValue {
  showAwardToast: (options: AwardToastOptions) => void;
}

const AwardToastContext = createContext<AwardToastContextValue | undefined>(
  undefined,
);

export const AwardToastProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [open, setOpen] = useState(false);
  const [toastData, setToastData] = useState<AwardToastOptions>({
    title: "",
    description: "",
    points: 0,
  });

  // Use a queue to handle multiple toasts
  const toastQueue = useRef<AwardToastOptions[]>([]);
  const isProcessing = useRef(false);

  const processNextToast = useCallback(() => {
    if (toastQueue.current.length === 0) {
      isProcessing.current = false;
      return;
    }

    isProcessing.current = true;
    const nextToast = toastQueue.current.shift();
    if (nextToast) {
      setToastData(nextToast);
      setOpen(true);
    }
  }, []);

  const showAwardToast = useCallback(
    (options: AwardToastOptions) => {
      console.log("showAwardToast called with options:", options);

      // Add to queue
      toastQueue.current.push(options);

      // If not currently processing a toast, start processing
      if (!isProcessing.current) {
        processNextToast();
      }
    },
    [processNextToast],
  );

  const handleOpenChange = useCallback(
    (open: boolean) => {
      setOpen(open);

      // When toast is closed, process the next one in queue
      if (!open) {
        setTimeout(processNextToast, 300); // Small delay before showing next toast
      }
    },
    [processNextToast],
  );

  return (
    <AwardToastContext.Provider value={{ showAwardToast }}>
      {children}
      <AwardToast
        open={open}
        onOpenChange={handleOpenChange}
        title={toastData.title}
        description={toastData.description}
        points={toastData.points}
        variant={toastData.variant}
      />
    </AwardToastContext.Provider>
  );
};

export const useAwardToast = () => {
  const context = useContext(AwardToastContext);
  if (context === undefined) {
    throw new Error("useAwardToast must be used within an AwardToastProvider");
  }
  return context;
};
