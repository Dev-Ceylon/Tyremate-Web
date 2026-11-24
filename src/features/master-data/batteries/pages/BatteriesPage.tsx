import { Outlet } from "@/lib/router"
import MasterDataEntityPageLayout from "../../shared/components/MasterDataEntityPageLayout"

export default function BatteriesPage() {
  return (
    <MasterDataEntityPageLayout
      title="Batteries"
      listDescription="Review battery records used across purchasing, inventory, and sales workflows."
      createDescription="Add a new battery record to your master data."
      editDescription="Update an existing battery record used across purchasing, inventory, and sales workflows."
      listPath="/master-data/batteries"
      insertLabel="Insert Battery"
      backLabel="Back to Batteries"
    >
      <Outlet />
    </MasterDataEntityPageLayout>
  )
}
