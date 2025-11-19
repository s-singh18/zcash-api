import { Router } from 'express';
import zcashController from '../controllers/zcash.controller';
import { authenticateApiKey } from '../middleware/auth.middleware';

const router = Router();

// Apply API key authentication to all routes
router.use(authenticateApiKey);

// Blockchain information
router.get('/blockchain/info', zcashController.getBlockchainInfo);
router.get('/blockchain/blockcount', zcashController.getBlockCount);
router.get('/blockchain/blockhash/:height', zcashController.getBlockHash);
router.get('/blockchain/block/:blockhash', zcashController.getBlock);

// Wallet operations
router.get('/wallet/info', zcashController.getWalletInfo);
router.get('/wallet/balance', zcashController.getBalance);
router.post('/wallet/newaddress', zcashController.getNewAddress);
router.get('/wallet/unspent', zcashController.listUnspent);

// Transactions
router.get('/transaction/:txid', zcashController.getTransaction);
router.get('/transactions', zcashController.listTransactions);
router.get('/transaction/:txid/raw', zcashController.getRawTransaction);
router.post('/transaction/send', zcashController.sendToAddress);

// Address validation
router.get('/address/validate/:address', zcashController.validateAddress);

// Network information
router.get('/network/info', zcashController.getNetworkInfo);
router.get('/network/connections', zcashController.getConnectionCount);

// Mining information
router.get('/mining/info', zcashController.getMiningInfo);

// Fee estimation
router.get('/fee/estimate', zcashController.estimateFee);

export default router;
