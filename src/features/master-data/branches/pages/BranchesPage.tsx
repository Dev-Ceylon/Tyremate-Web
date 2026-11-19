import { Outlet } from "@/lib/router"
import MasterDataEntityPageLayout from "../../shared/components/MasterDataEntityPageLayout"

export default function BranchesPage() {
  return (
    <MasterDataEntityPageLayout
      title="Branches"
      listDescription="Review branch records used across storage and inventory workflows."
      createDescription="Add a new branch record to your master data."
      editDescription="Update an existing branch record used across storage and inventory workflows."
      listPath="/master-data/branches"
      insertLabel="Insert Branch"
      backLabel="Back to Branches"
    >
      <Outlet />
    </MasterDataEntityPageLayout>
  )
}
