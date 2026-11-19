import { useNavigate } from "@/lib/router"

interface NotificationToastProps {
  title: string;
  description: string;
  navigationPath?: string | null;
  onDismiss?: () => void;
}

export function NotificationToast({
  title,
  description,
  navigationPath,
  onDismiss,
}: NotificationToastProps) {
  const navigate = useNavigate();

  const handleNavigate = () => {
    if (navigationPath) {
      navigate(navigationPath);
    }

    onDismiss?.();
  };

  return (
    <>
      <strong>{title}</strong>

      {description && <p>{description}</p>}

      {navigationPath && (
        <button
          type="button"
          className="text-link"
          onClick={handleNavigate}
          aria-label="View details"
        >
          View Details
        </button>
      )}
    </>
  );
}
