import type { ReminderRecord } from "../models/reminder"

type ReminderTableProps = {
  data: ReminderRecord[]
  deletingId: number | null
  viewingId: number | null
  onDelete: (id: number) => void
  onView: (reminder: ReminderRecord) => Promise<void>
}

export const ReminderTable = ({
  data,
  deletingId,
  viewingId,
  onDelete,
  onView,
}: ReminderTableProps) => {
  if (data.length === 0) return <p className="table-empty">No reminders found.</p>

  return (
    <table className="product-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Date</th>
          <th>Type</th>
          <th className="text-center">Status</th>
          <th className="text-center">Actions</th>
        </tr>
      </thead>
      <tbody>
        {data.map((r) => {
          const isDeleting = deletingId === r.ID
          const isViewing = viewingId === r.ID
          return (
            <tr key={r.ID}>
              <td className="mono-text">#{r.ID}</td>
              <td className="secondary-text">{r.Date || "-"}</td>
              <td>
                <div className="flex-column">
                  <span className="font-medium">{r.ReminderTypeName || "-"}</span>
                </div>
              </td>
              <td className="text-center">
                <div className="flex-center gap-2">
                  {r.IsCompleted ? (
                    <span className="status-badge status-completed">Completed</span>
                  ) : (
                    <span className="status-badge status-pending">Pending</span>
                  )}
                </div>
              </td>
              <td>
                <div className="table-actions">
                  <button 
                    type="button" 
                    className="secondary-action table-action" 
                    onClick={() => void onView(r)}
                    disabled={isViewing}
                  >
                    {isViewing ? "Opening..." : "View"}
                  </button>
                  <button type="button" className="secondary-action table-action" onClick={() => onDelete(r.ID)} disabled={isDeleting}>
                    {isDeleting ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
