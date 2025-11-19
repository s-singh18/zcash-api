import axios, { AxiosInstance } from 'axios';
import config from '../config/config';
import { ZCashRPCRequest, ZCashRPCResponse } from '../types/zcash.types';

class ZCashService {
  private client: AxiosInstance;
  private requestId: number = 0;

  constructor() {
    this.client = axios.create({
      baseURL: config.zcash.rpcUrl,
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'x-api-key': config.zcash.apiKey,
      },
      timeout: 30000,
    });
  }

  /**
   * Make a generic RPC call to the ZCash node via Tatum API
   */
  async rpcCall<T = any>(method: string, params: any[] = []): Promise<T> {
    const request: ZCashRPCRequest = {
      jsonrpc: '2.0',
      id: ++this.requestId,
      method,
      params,
    };

    try {
      const response = await this.client.post<ZCashRPCResponse<T>>('', request);

      if (response.data.error) {
        throw new Error(
          `RPC Error: ${response.data.error.message} (Code: ${response.data.error.code})`
        );
      }

      return response.data.result;
    } catch (error: any) {
      if (error.response) {
        throw new Error(
          `ZCash RPC Error: ${error.response.data?.error?.message || error.message}`
        );
      }
      throw new Error(`Network Error: ${error.message}`);
    }
  }

  /**
   * Get blockchain information
   */
  async getBlockchainInfo() {
    return this.rpcCall('getblockchaininfo');
  }

  /**
   * Get wallet information
   */
  async getWalletInfo() {
    return this.rpcCall('getwalletinfo');
  }

  /**
   * Get balance
   */
  async getBalance(minConfirmations: number = 1) {
    return this.rpcCall('getbalance', ['*', minConfirmations]);
  }

  /**
   * Get new address
   */
  async getNewAddress(account: string = '') {
    return this.rpcCall<string>('getnewaddress', [account]);
  }

  /**
   * Get transaction by txid
   */
  async getTransaction(txid: string) {
    return this.rpcCall('gettransaction', [txid]);
  }

  /**
   * List transactions
   */
  async listTransactions(count: number = 10, skip: number = 0) {
    return this.rpcCall('listtransactions', ['*', count, skip]);
  }

  /**
   * Send to address
   */
  async sendToAddress(address: string, amount: number, comment: string = '') {
    return this.rpcCall<string>('sendtoaddress', [address, amount, comment]);
  }

  /**
   * Validate address
   */
  async validateAddress(address: string) {
    return this.rpcCall('validateaddress', [address]);
  }

  /**
   * Get block by hash
   */
  async getBlock(blockhash: string, verbosity: number = 1) {
    return this.rpcCall('getblock', [blockhash, verbosity]);
  }

  /**
   * Get block count
   */
  async getBlockCount() {
    return this.rpcCall<number>('getblockcount');
  }

  /**
   * Get block hash by height
   */
  async getBlockHash(height: number) {
    return this.rpcCall<string>('getblockhash', [height]);
  }

  /**
   * Get network info
   */
  async getNetworkInfo() {
    return this.rpcCall('getnetworkinfo');
  }

  /**
   * Get mining info
   */
  async getMiningInfo() {
    return this.rpcCall('getmininginfo');
  }

  /**
   * List unspent transactions
   */
  async listUnspent(
    minConfirmations: number = 1,
    maxConfirmations: number = 9999999
  ) {
    return this.rpcCall('listunspent', [minConfirmations, maxConfirmations]);
  }

  /**
   * Get raw transaction
   */
  async getRawTransaction(txid: string, verbose: boolean = false) {
    return this.rpcCall('getrawtransaction', [txid, verbose ? 1 : 0]);
  }

  /**
   * Estimate fee
   */
  async estimateFee(nblocks: number = 6) {
    return this.rpcCall('estimatefee', [nblocks]);
  }

  /**
   * Get connection count
   */
  async getConnectionCount() {
    return this.rpcCall<number>('getconnectioncount');
  }
}

export default new ZCashService();
