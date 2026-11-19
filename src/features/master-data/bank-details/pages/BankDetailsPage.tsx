import { Outlet } from "@/lib/router";
import MasterDataEntityPageLayout from "../../shared/components/MasterDataEntityPageLayout";

export default function BankDetailsPage() {
  return (
    <MasterDataEntityPageLayout
      title="Bank Details"
      listDescription="Manage bank account reference records for financial transactions and settlements."
      createDescription="Add a new bank account record to your master data."
      editDescription="Update an existing bank account record."
      listPath="/master-data/bank-details"
      insertLabel="Insert Bank Detail"
      backLabel="Back to Bank Details"
    >
      <Outlet />
    </MasterDataEntityPageLayout>
  )
}