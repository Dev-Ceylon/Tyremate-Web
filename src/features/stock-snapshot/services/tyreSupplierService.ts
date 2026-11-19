/**
 * Service to interact with Tyre-Supplier relationships via IPC.
 */
export const tyreSupplierService = {
  getSuppliersByTyreId: (tyreId: number): Promise<any[]> => 
    (window as any).api.invoke('tyre-suppliers:get-by-tyre-id', tyreId)
};