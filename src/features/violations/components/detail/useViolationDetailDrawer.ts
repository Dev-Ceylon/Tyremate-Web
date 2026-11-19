import { useEffect, useRef, useCallback } from "react";

interface UseViolationDetailDrawerReturn {
  drawerRef: React.RefObject<HTMLDivElement | null>;
  handleKeyDown: (e: KeyboardEvent) => void;
}

export function useViolationDetailDrawer(
  isOpen: boolean,
  onClose: () => void
): UseViolationDetailDrawerReturn {
  const drawerRef = useRef<HTMLDivElement | null>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      document.body.style.overflow = "hidden";
      requestAnimationFrame(() => {
        drawerRef.current?.focus();
      });
    } else {
      document.body.style.overflow = "";
      previousActiveElement.current?.focus();
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  return { drawerRef, handleKeyDown };
}