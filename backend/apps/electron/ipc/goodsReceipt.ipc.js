const goodsReceiptService = require("../../../packages/services/goodsReceiptService")
const dagGoodsReceiptService = require("../../../packages/services/dagGoodsReceiptService")
const { registerIpcHandler, registerServiceHandler } = require("./errorMiddleware")

registerIpcHandler("goodsReceipts:getByPO", { permission: "po.view" }, (_event, poId) =>
  goodsReceiptService.getGoodsReceiptsByPoId(poId)
)

registerIpcHandler("goodsReceipts:getPending", { permission: "po.view" }, (_event, filters) =>
  goodsReceiptService.getPendingGoodsReceipts(filters ?? {})
)

registerServiceHandler("goodsReceipts:post", { permission: "po.edit" }, goodsReceiptService, "postGoodsReceipt")

// DAG stock returned to quarantine is received through the same GRN screen, so
// these handlers live alongside the PO ones and share their permission names.
registerIpcHandler("goodsReceipts:getPendingDag", { permission: "po.view" }, () =>
  dagGoodsReceiptService.getPendingDagGoodsReceipts())
registerServiceHandler("goodsReceipts:postDag", { permission: "po.edit" }, dagGoodsReceiptService, "postDagGoodsReceipt")
