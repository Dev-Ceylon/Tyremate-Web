"use client"
import { useCallback, useEffect, useId, useState } from "react"
import { useToast } from "../../../shared/ui/toast/ToastProvider"
import { AppModal } from "../../../shared/ui/modal/AppModal"
import { adminApi, type AdminRole, type AdminUser } from "../services/adminClient"

function errorText(error: unknown) {
  return error instanceof Error ? error.message : String(error)
}

type Editing = { mode: "create" } | { mode: "edit"; user: AdminUser } | { mode: "password"; user: AdminUser } | null

export function UsersCard() {
  const ids = useId()
  const { showToast } = useToast()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [roles, setRoles] = useState<AdminRole[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Editing>(null)
  const [username, setUsername] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [password, setPassword] = useState("")
  const [roleIds, setRoleIds] = useState<number[]>([])
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [u, r] = await Promise.all([adminApi.listUsers(), adminApi.listRoles()])
      setUsers(u)
      setRoles(r)
    } catch (error) {
      showToast({ variant: "error", title: "Could not load users", message: errorText(error) })
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    void load()
  }, [load])

  const open = (next: Editing) => {
    setEditing(next)
    setPassword("")
    if (next?.mode === "edit") {
      setDisplayName(next.user.displayName ?? "")
      setRoleIds(next.user.roles.map((r) => Number(r.roleId)))
    } else if (next?.mode === "create") {
      setUsername("")
      setDisplayName("")
      setRoleIds([3])
    }
  }

  const submit = async () => {
    if (!editing) return
    setSaving(true)
    try {
      if (editing.mode === "create") {
        await adminApi.createUser({ username, displayName, password, roleIds })
        showToast({ variant: "success", title: "User created", message: username })
      } else if (editing.mode === "edit") {
        await adminApi.updateUser(editing.user.id, { displayName, roleIds })
        showToast({ variant: "success", title: "User updated", message: editing.user.username })
      } else {
        await adminApi.resetPassword(editing.user.id, password)
        showToast({ variant: "success", title: "Password reset", message: editing.user.username })
      }
      setEditing(null)
      await load()
    } catch (error) {
      showToast({ variant: "error", title: "Save failed", message: errorText(error) })
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (user: AdminUser) => {
    try {
      await adminApi.updateUser(user.id, { isActive: !user.isActive })
      await load()
    } catch (error) {
      showToast({ variant: "error", title: "Update failed", message: errorText(error) })
    }
  }

  const toggleRole = (roleId: number) =>
    setRoleIds((current) => (current.includes(roleId) ? current.filter((r) => r !== roleId) : [...current, roleId]))

  const title =
    editing?.mode === "create" ? "New user" : editing?.mode === "edit" ? `Edit ${editing.user.username}` : editing ? `Reset password: ${editing.user.username}` : ""

  return (
    <section className="panel tm-card" aria-labelledby={`${ids}-title`}>
      <div className="tm-inline" style={{ justifyContent: "space-between" }}>
        <div>
          <p className="eyebrow">Access</p>
          <h2 id={`${ids}-title`}>Users &amp; roles</h2>
          <p className="tm-card-sub">Change the seeded default passwords before sharing the application.</p>
        </div>
        <button type="button" className="primary-action" onClick={() => open({ mode: "create" })}>
          New user
        </button>
      </div>

      <div className="tm-table-wrap">
        <table className="tm-table">
          <thead>
            <tr>
              <th scope="col">Username</th>
              <th scope="col">Name</th>
              <th scope="col">Roles</th>
              <th scope="col">Status</th>
              <th scope="col">
                <span className="visually-hidden">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5}>Loading…</td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id}>
                  <td className="font-semibold">{user.username}</td>
                  <td>{user.displayName ?? "—"}</td>
                  <td>{user.roles.map((r) => r.roleName).join(", ") || "—"}</td>
                  <td>
                    <span className={`tm-status ${user.isActive ? "tm-status-ok" : "tm-status-error"}`}>
                      {user.isActive ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td>
                    <div className="tm-inline" style={{ justifyContent: "flex-end" }}>
                      <button type="button" className="secondary-action" onClick={() => open({ mode: "edit", user })}>
                        Edit
                      </button>
                      <button type="button" className="secondary-action" onClick={() => open({ mode: "password", user })}>
                        Reset password
                      </button>
                      <button type="button" className="secondary-action" onClick={() => void toggleActive(user)}>
                        {user.isActive ? "Disable" : "Enable"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AppModal isOpen={editing !== null} title={title} onClose={() => setEditing(null)}>
        <form
          className="tm-form"
          onSubmit={(e) => {
            e.preventDefault()
            void submit()
          }}
        >
          {editing?.mode === "create" ? (
            <div className="tm-form-row">
              <label className="field-label" htmlFor={`${ids}-username`}>
                Username
              </label>
              <input id={`${ids}-username`} className="text-input" value={username} required autoComplete="off" onChange={(e) => setUsername(e.target.value)} />
            </div>
          ) : null}
          {editing?.mode !== "password" ? (
            <>
              <div className="tm-form-row">
                <label className="field-label" htmlFor={`${ids}-display`}>
                  Display name
                </label>
                <input id={`${ids}-display`} className="text-input" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
              </div>
              <fieldset className="tm-form-row">
                <legend className="field-label">Roles</legend>
                {roles.map((role) => (
                  <label key={role.roleId} className="tm-inline">
                    <input type="checkbox" checked={roleIds.includes(role.roleId)} onChange={() => toggleRole(role.roleId)} />
                    <span>
                      {role.roleName}
                      {role.description ? <small className="secondary-text"> — {role.description}</small> : null}
                    </span>
                  </label>
                ))}
              </fieldset>
            </>
          ) : null}
          {editing?.mode !== "edit" ? (
            <div className="tm-form-row">
              <label className="field-label" htmlFor={`${ids}-password`}>
                {editing?.mode === "password" ? "New password" : "Password"}
              </label>
              <input
                id={`${ids}-password`}
                className="text-input"
                type="password"
                minLength={6}
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <p className="tm-note">At least 6 characters.</p>
            </div>
          ) : null}
          <div className="modal-actions">
            <button type="button" className="secondary-action" onClick={() => setEditing(null)}>
              Cancel
            </button>
            <button type="submit" className="primary-action" disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </AppModal>
    </section>
  )
}
