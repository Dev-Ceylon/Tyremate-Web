import { Outlet } from "@/lib/router"
import MasterDataEntityPageLayout from "../../shared/components/MasterDataEntityPageLayout"

export default function ContractorsPage() {
  return (
    <MasterDataEntityPageLayout
      title="Contractors"
      listDescription="Review contractor records and their linked tyres for operational planning."
      createDescription="Add a new contractor and assign related tyres."
      editDescription="Update contractor details and adjust linked tyres."
      listPath="/master-data/contractors"
      insertLabel="Insert Contractor"
      backLabel="Back to Contractors"
    >
      <Outlet />
    </MasterDataEntityPageLayout>
  )
}
