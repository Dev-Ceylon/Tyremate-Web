import { useNavigate } from "@/lib/router"
import type { ReminderNotification } from "../../models/notification"

interface InquiryNotificationToastProps {
  title: string;
  reminder: ReminderNotification;
  onDismiss?: () => void;
}

export function InquiryNotificationToast({
  title,
  reminder,
  onDismiss,
}: InquiryNotificationToastProps) {
  const navigate = useNavigate();

  const inquiryId =
    reminder.inquiryDetails?.InquiryID;

  const message =
    reminder.inquiryDetails?.CustomerName ||
    reminder.reminderNote;

  const handleOpenInquiry = () => {
    if (inquiryId) {
      navigate(`/inquiries/${inquiryId}`);
    }

    onDismiss?.();
  };

  return (
    <>
      <strong>{title}</strong>

      {message && <p>{message}</p>}

      <button
        type="button"
        className="text-link"
        onClick={handleOpenInquiry}
        aria-label="Open inquiry details"
      >
        Open Inquiry
      </button>
    </>
  );
}