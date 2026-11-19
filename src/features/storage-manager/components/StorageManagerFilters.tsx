import type { BranchRecord } from "../../master-data/branches/models/branch"

type StorageManagerFiltersProps = {
  branches: BranchRecord[]
  selectedBranchId: number | null
  loadingBranches?: boolean
  onSelectBranch: (branchId: number | null) => void
}

export function StorageManagerFilters({
  branches,
  selectedBranchId,
  loadingBranches = false,
  onSelectBranch,
}: StorageManagerFiltersProps) {
  return (
    <section className="table-panel panel panel-strong">
      <div className="table-panel-header">
        <div>
          <p className="section-label">Storage Filters</p>
          <h2>Choose branch</h2>
        </div>
      </div>

      <div className="login-form">
        <label className="field-label">
          Branch
          <select
            className="text-input"
            value={selectedBranchId ?? ""}
            onChange={(event) => onSelectBranch(Number(event.target.value || 0) || null)}
            disabled={loadingBranches}
          >
            <option value="">
              {loadingBranches ? "Loading branches..." : "Select a branch"}
            </option>
            {branches.map((branch) => (
              <option key={branch.Id} value={branch.Id}>
                {branch.BranchCode} - {branch.BranchName}
              </option>
            ))}
          </select>
        </label>
      </div>
    </section>
  )
}
