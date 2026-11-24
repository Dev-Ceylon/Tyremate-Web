import { Outlet } from "@/lib/router"
import MasterDataEntityPageLayout from "../../shared/components/MasterDataEntityPageLayout"

export default function BatteryLocationsPage() {
  return (
    <MasterDataEntityPageLayout
      title="Battery Locations"
      listDescription="Review warehouse and branch battery storage locations used across battery inventory and shelf-life workflows."
      createDescription="Add a new battery storage location to your master data."
      editDescription="Update an existing battery storage location used across battery inventory workflows."
      listPath="/master-data/battery-locations"
      insertLabel="Insert Battery Location"
      backLabel="Back to Battery Locations"
    >
      <Outlet />
    </MasterDataEntityPageLayout>
  )
}
