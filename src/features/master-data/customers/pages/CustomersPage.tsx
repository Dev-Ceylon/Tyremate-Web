import { Outlet } from "@/lib/router"
import MasterDataEntityPageLayout from "../../shared/components/MasterDataEntityPageLayout"

export default function CustomersPage() {
  return (
    <MasterDataEntityPageLayout
      title="Customers"
      listDescription="Review customer records used across sales and service workflows."
      createDescription="Add a new customer record to your master data."
      editDescription="Update an existing customer record used across sales and service workflows."
      listPath="/master-data/customers"
      insertLabel="Insert Customer"
      backLabel="Back to Customers"
    >
      <Outlet />
    </MasterDataEntityPageLayout>
  )
}
