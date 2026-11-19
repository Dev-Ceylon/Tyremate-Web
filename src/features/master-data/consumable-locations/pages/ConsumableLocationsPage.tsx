import { Outlet } from "@/lib/router"
import MasterDataEntityPageLayout from "../../shared/components/MasterDataEntityPageLayout"

export default function ConsumableLocationsPage() {
  return (
    <MasterDataEntityPageLayout
      title="Consumable Locations"
      listDescription="Review storage locations used for consumable inventory."
      createDescription="Add a new consumable storage location to your master data."
      editDescription="Update an existing consumable storage location."
      listPath="/master-data/consumable-locations"
      insertLabel="Insert Consumable Location"
      backLabel="Back to Consumable Locations"
    >
      <Outlet />
    </MasterDataEntityPageLayout>
  )
}
