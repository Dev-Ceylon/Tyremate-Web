const bankDetailsService = require('../../../packages/services/bankDetailsService');
const { registerIpcHandler, registerServiceHandler } = require('./errorMiddleware');

registerIpcHandler('bank-details:get-all', {}, () => bankDetailsService.getBankDetails());

registerIpcHandler('bank-details:get-by-id', {}, (_event, id) => bankDetailsService.getBankDetailsById(id));

registerServiceHandler('bank-details:create', {}, bankDetailsService, 'createBankDetails');

registerServiceHandler('bank-details:update', {}, bankDetailsService, 'updateBankDetails');

registerServiceHandler('bank-details:delete', {}, bankDetailsService, 'deleteBankDetails');
