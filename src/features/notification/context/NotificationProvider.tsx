import {
  useEffect,
  type ReactNode,
} from "react";

import {
  useToast,
} from "../../../shared/ui/toast/ToastProvider";

import type {
  ReminderNotificationPayload,
  NotificationRecord,
} from "../models/notification";

import {
  NotificationToast,
} from "../components/toasters/NotificationToast";

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({
  children,
}: NotificationProviderProps) {

  const { showToast } = useToast();

  useEffect(() => {

    const unsubscribe =
      window.api.notificationEvents.inquiryNotification(
        (
          payload: ReminderNotificationPayload
        ) => {

          payload.existingNotifications.forEach(
            (
              notification: NotificationRecord
            ) => {

              showToast({
                title: notification.title,
                variant: "info",

                content: (
                  <NotificationToast
                    title={notification.title}
                    description={notification.description}
                    navigationPath={notification.navigationPath}
                  />
                ),
              });

            }
          );

        }
      );

    return () => {
      unsubscribe?.();
    };

  }, [showToast]);

  return <>{children}</>;
}