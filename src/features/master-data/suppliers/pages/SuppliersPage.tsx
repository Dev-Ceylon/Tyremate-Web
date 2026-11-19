import { Outlet } from "@/lib/router"
import MasterDataEntityPageLayout from "../../shared/components/MasterDataEntityPageLayout"

export default function SuppliersPage() {
  return (
    <MasterDataEntityPageLayout
      title="Suppliers"
      listDescription="Review supplier records used across purchasing and inventory workflows."
      createDescription="Add a new supplier record to your master data."
      editDescription="Update an existing supplier record used across purchasing and inventory workflows."
      listPath="/master-data/suppliers"
      insertLabel="Insert Supplier"
      backLabel="Back to Suppliers"
    >
      <Outlet />
    </MasterDataEntityPageLayout>
  )
}
