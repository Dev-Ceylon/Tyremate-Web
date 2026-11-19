export interface FilterTab {
  key: string
  label: string
  badge?: number
}

type FilterTabsProps = {
  tabs: FilterTab[]
  activeKey: string
  onChange: (key: string) => void
}

export const FilterTabs = ({ tabs, activeKey, onChange }: FilterTabsProps) => {
  return (
    <div className="filter-tabs" role="tablist">
      {tabs.map((tab) => {
        const isActive = tab.key === activeKey
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`filter-tab${isActive ? " filter-tab-active" : ""}`}
            onClick={() => onChange(tab.key)}
          >
            <span className="filter-tab-label">{tab.label}</span>
            {typeof tab.badge === "number" && tab.badge > 0 && (
              <span className="filter-tab-badge">{tab.badge}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}
