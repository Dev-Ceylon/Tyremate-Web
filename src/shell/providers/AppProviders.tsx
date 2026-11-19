import { ToastProvider } from '../../shared/ui/toast/ToastProvider'
import { ConfirmProvider } from '../../shared/ui/confirm/ConfirmProvider'
import { AuthProvider } from "../../features/auth/hooks/AuthProvider"
import { ReminderProvider } from "../../features/reminder/context/ReminderProvider"
import { composeProviders } from "./composeProviders"
import { NotificationProvider } from '../../features/notification/context/NotificationProvider'
import { GlobalErrorHandler } from '../../shared/errors/GlobalErrorHandler'


export const AppProviders =
  composeProviders([
    ToastProvider,
    ConfirmProvider,
    GlobalErrorHandler,
    NotificationProvider,
    AuthProvider,
    ReminderProvider,
  ])