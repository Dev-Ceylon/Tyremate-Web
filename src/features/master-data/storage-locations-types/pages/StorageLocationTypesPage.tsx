import { Outlet } from "@/lib/router"
import MasterDataEntityPageLayout from "../../shared/components/MasterDataEntityPageLayout"

export default function StorageLocationTypesPage() {
  return (
    <MasterDataEntityPageLayout
      title="Storage Location Types"
      listDescription="Manage categories for storage locations to better organize warehouse space."
      createDescription="Add a new storage location type to your master data."
      editDescription="Update an existing storage location type used across inventory workflows."
      listPath="/master-data/storage-locations-types"
      insertLabel="Insert Storage Location Type"
      backLabel="Back to Storage Location Types"
    >
      <Outlet />
    </MasterDataEntityPageLayout>
  )
}