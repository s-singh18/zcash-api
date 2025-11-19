import { Request, Response, NextFunction } from 'express';
import zcashService from '../services/zcash.service';

class ZCashController {
  /**
   * Get blockchain information
   */
  async getBlockchainInfo(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await zcashService.getBlockchainInfo();
      res.json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get wallet information
   */
  async getWalletInfo(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await zcashService.getWalletInfo();
      res.json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get balance
   */
  async getBalance(req: Request, res: Response, next: NextFunction) {
    try {
      const minConfirmations = parseInt(
        req.query.minConfirmations as string
      ) || 1;
      const balance = await zcashService.getBalance(minConfirmations);
      res.json({
        success: true,
        data: { balance, minConfirmations },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get new address
   */
  async getNewAddress(req: Request, res: Response, next: NextFunction) {
    try {
      const account = (req.body.account as string) || '';
      const address = await zcashService.getNewAddress(account);
      res.json({
        success: true,
        data: { address },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get transaction by txid
   */
  async getTransaction(req: Request, res: Response, next: NextFunction) {
    try {
      const { txid } = req.params;
      if (!txid) {
        return res.status(400).json({
          success: false,
          error: 'Transaction ID is required',
        });
      }
      const transaction = await zcashService.getTransaction(txid);
      res.json({
        success: true,
        data: transaction,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * List transactions
   */
  async listTransactions(req: Request, res: Response, next: NextFunction) {
    try {
      const count = parseInt(req.query.count as string) || 10;
      const skip = parseInt(req.query.skip as string) || 0;
      const transactions = await zcashService.listTransactions(count, skip);
      res.json({
        success: true,
        data: transactions,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Send to address
   */
  async sendToAddress(req: Request, res: Response, next: NextFunction) {
    try {
      const { address, amount, comment } = req.body;

      if (!address || !amount) {
        return res.status(400).json({
          success: false,
          error: 'Address and amount are required',
        });
      }

      const txid = await zcashService.sendToAddress(address, amount, comment);
      res.json({
        success: true,
        data: { txid },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Validate address
   */
  async validateAddress(req: Request, res: Response, next: NextFunction) {
    try {
      const { address } = req.params;
      if (!address) {
        return res.status(400).json({
          success: false,
          error: 'Address is required',
        });
      }
      const validation = await zcashService.validateAddress(address);
      res.json({
        success: true,
        data: validation,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get block by hash
   */
  async getBlock(req: Request, res: Response, next: NextFunction) {
    try {
      const { blockhash } = req.params;
      const verbosity = parseInt(req.query.verbosity as string) || 1;

      if (!blockhash) {
        return res.status(400).json({
          success: false,
          error: 'Block hash is required',
        });
      }

      const block = await zcashService.getBlock(blockhash, verbosity);
      res.json({
        success: true,
        data: block,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get block count
   */
  async getBlockCount(req: Request, res: Response, next: NextFunction) {
    try {
      const blockCount = await zcashService.getBlockCount();
      res.json({
        success: true,
        data: { blockCount },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get block hash by height
   */
  async getBlockHash(req: Request, res: Response, next: NextFunction) {
    try {
      const height = parseInt(req.params.height);

      if (isNaN(height)) {
        return res.status(400).json({
          success: false,
          error: 'Valid block height is required',
        });
      }

      const blockhash = await zcashService.getBlockHash(height);
      res.json({
        success: true,
        data: { height, blockhash },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get network info
   */
  async getNetworkInfo(req: Request, res: Response, next: NextFunction) {
    try {
      const networkInfo = await zcashService.getNetworkInfo();
      res.json({
        success: true,
        data: networkInfo,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get mining info
   */
  async getMiningInfo(req: Request, res: Response, next: NextFunction) {
    try {
      const miningInfo = await zcashService.getMiningInfo();
      res.json({
        success: true,
        data: miningInfo,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * List unspent transactions
   */
  async listUnspent(req: Request, res: Response, next: NextFunction) {
    try {
      const minConfirmations = parseInt(
        req.query.minConfirmations as string
      ) || 1;
      const maxConfirmations = parseInt(
        req.query.maxConfirmations as string
      ) || 9999999;

      const unspent = await zcashService.listUnspent(
        minConfirmations,
        maxConfirmations
      );
      res.json({
        success: true,
        data: unspent,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get raw transaction
   */
  async getRawTransaction(req: Request, res: Response, next: NextFunction) {
    try {
      const { txid } = req.params;
      const verbose = req.query.verbose === 'true';

      if (!txid) {
        return res.status(400).json({
          success: false,
          error: 'Transaction ID is required',
        });
      }

      const rawTx = await zcashService.getRawTransaction(txid, verbose);
      res.json({
        success: true,
        data: rawTx,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Estimate fee
   */
  async estimateFee(req: Request, res: Response, next: NextFunction) {
    try {
      const nblocks = parseInt(req.query.nblocks as string) || 6;
      const fee = await zcashService.estimateFee(nblocks);
      res.json({
        success: true,
        data: { fee, nblocks },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get connection count
   */
  async getConnectionCount(req: Request, res: Response, next: NextFunction) {
    try {
      const connections = await zcashService.getConnectionCount();
      res.json({
        success: true,
        data: { connections },
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new ZCashController();
