import { Outlet } from "@/lib/router"
import MasterDataEntityPageLayout from "../../shared/components/MasterDataEntityPageLayout"

export default function ConsumablesPage() {
  return (
    <MasterDataEntityPageLayout
      title="Consumables"
      listDescription="Review consumable records used across service and inventory workflows."
      createDescription="Add a new consumable record to your master data."
      editDescription="Update an existing consumable record used across service and inventory workflows."
      listPath="/master-data/consumables"
      insertLabel="Insert Consumable"
      backLabel="Back to Consumables"
    >
      <Outlet />
    </MasterDataEntityPageLayout>
  )
}
