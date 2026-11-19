import { Outlet } from "@/lib/router"
import MasterDataEntityPageLayout from "../../shared/components/MasterDataEntityPageLayout"

export default function StorageLocationsPage() {
  return (
    <MasterDataEntityPageLayout
      title="Storage Locations"
      listDescription="Review warehouse and branch storage locations used across inventory workflows."
      createDescription="Add a new storage location to your master data."
      editDescription="Update an existing storage location used across inventory workflows."
      listPath="/master-data/storage-locations/tyres"
      insertLabel="Insert Storage Location"
      backLabel="Back to Storage Locations"
    >
      <Outlet />
    </MasterDataEntityPageLayout>
  )
}
