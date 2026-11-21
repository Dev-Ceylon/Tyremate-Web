import { useNavigate } from "@/lib/router"
import { useReminderList } from "../hooks/useReminderList"
import { ReminderTable } from "../components/ReminderTable"
import { TyreExpiryReminderModal } from "../components/TyreExpiryReminderModal"
import { BatteryReminderModal } from "../components/BatteryReminderModal"
import { FilterTabs } from "../../../shared/ui/filterTabs/FilterTabs"
import {
  getReminderTypeName,
  REMINDER_TYPE_LIST,
} from "../../../shared/constants/reminderTypeConstants"
import type { FilterTab } from "../../../shared/ui/filterTabs/FilterTabs"
import type { ReminderRecord } from "../models/reminder"

function buildTabs(reminders: ReminderRecord[]): FilterTab[] {
  const countByType = (type: string) =>
    reminders.filter((r) => r.ReminderTypeCode === type).length

  const typeTabs: FilterTab[] = REMINDER_TYPE_LIST.map((code) => ({
    key: code,
    label: getReminderTypeName(code),
    badge: countByType(code),
  }))

  return [{ key: "all", label: "All", badge: reminders.length }, ...typeTabs]
}

export default function ReminderListPage() {
  const navigate = useNavigate()
  const {
    filteredReminders,
    reminders,
    activeType,
    setActiveType,
    loading,
    error,
    deletingId,
    viewingId,
    handleDelete,
    handleViewReminder,
    tyreExpiryReminder,
    tyreExpiryDetails,
    tyreExpiryModalOpen,
    tyreExpiryLoading,
    closeTyreExpiryModal,
    gotoStock,
    batteryReminder,
    batteryDetails,
    batteryModalOpen,
    batteryLoading,
    batteryCompleting,
    closeBatteryModal,
    gotoBatteryStock,
    handleMarkBatteryCompleted,
  } = useReminderList()

  const tabs = buildTabs(reminders)

  return (
    <main className="app-shell">
      <section className="page-header panel">
        <div>
          <p className="eyebrow">Reminders</p>
          <h1>Reminder List</h1>
          <p className="hero-text">View and manage all reminders and follow-ups.</p>
        </div>
        <div className="header-actions">
          <button className="primary-action" onClick={() => navigate("/reminders/new")}>Create New Reminder</button>
        </div>
      </section>

      <section className="table-panel panel panel-strong">
        <div className="table-panel-header">
          <h2>Reminders</h2>
        </div>

        <FilterTabs tabs={tabs} activeKey={activeType} onChange={setActiveType} />

        {loading ? (
          <p className="hero-text">Loading reminders...</p>
        ) : error ? (
          <p className="hero-text error-text">{error}</p>
        ) : (
          <ReminderTable
            data={filteredReminders}
            deletingId={deletingId}
            viewingId={viewingId}
            onDelete={handleDelete}
            onView={handleViewReminder}
          />
        )}
      </section>

      <TyreExpiryReminderModal
        isOpen={tyreExpiryModalOpen}
        reminder={tyreExpiryReminder}
        details={tyreExpiryDetails?.tyreExpiryDetails ?? null}
        loading={tyreExpiryLoading}
        onClose={closeTyreExpiryModal}
        onViewStock={gotoStock}
      />

      <BatteryReminderModal
        isOpen={batteryModalOpen}
        reminder={batteryReminder}
        details={batteryDetails?.batteryDetails ?? null}
        loading={batteryLoading}
        onClose={closeBatteryModal}
        onViewStock={gotoBatteryStock}
        onMarkCompleted={handleMarkBatteryCompleted}
        completing={batteryCompleting}
      />
    </main>
  )
}
