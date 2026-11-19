import { Outlet } from "@/lib/router"
import MasterDataEntityPageLayout from "../../shared/components/MasterDataEntityPageLayout"

export default function TyresPage() {
  return (
    <MasterDataEntityPageLayout
      title="Tyres"
      listDescription="Review tyre records used across purchasing and sales workflows."
      createDescription="Add a new tyre record to your master data."
      editDescription="Update an existing tyre record used across purchasing and sales workflows."
      listPath="/master-data/tyres"
      insertLabel="Insert Tyre"
      backLabel="Back to Tyres"
    >
      <Outlet />
    </MasterDataEntityPageLayout>
  )
}
