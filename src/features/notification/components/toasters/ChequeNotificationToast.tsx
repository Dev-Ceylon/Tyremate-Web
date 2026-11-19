import { useNavigate } from "@/lib/router"
import type { ReminderNotification } from "../../models/notification"

interface ChequeNotificationToastProps {
  title: string;
  reminder: ReminderNotification;
  onDismiss?: () => void;
}

export function ChequeNotificationToast({
  title,
  reminder,
  onDismiss,
}: ChequeNotificationToastProps) {
  const navigate = useNavigate();

  const soId = reminder.chequeDetails?.SoID;
  const message = reminder.reminderNote;

  const handleOpenSalesOrder = () => {
    if (soId) {
      navigate(`/sales-orders/${soId}`);
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
        onClick={handleOpenSalesOrder}
        aria-label="Open sales order details"
      >
        Open Sales Order
      </button>
    </>
  );
}
