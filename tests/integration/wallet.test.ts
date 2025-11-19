import testClient from '../utils/testClient';

// Helper function to add delay between tests to avoid rate limiting
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('Wallet Endpoints', () => {
  // Add delay between each test to avoid rate limiting
  beforeEach(async () => {
    await delay(1000); // 1 second delay between tests
  });
  describe('GET /api/zcash/wallet/info', () => {
    it('should return wallet information', async () => {
      const response = await testClient.getWalletInfo();

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toBeDefined();
      expect(response.data.data.walletversion).toBeDefined();
      expect(response.data.data.balance).toBeDefined();
      expect(typeof response.data.data.balance).toBe('number');
    });
  });

  describe('GET /api/zcash/wallet/balance', () => {
    it('should return wallet balance with default confirmations', async () => {
      const response = await testClient.getBalance();

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.balance).toBeDefined();
      expect(typeof response.data.data.balance).toBe('number');
      expect(response.data.data.minConfirmations).toBe(1);
    });

    it('should return balance with custom min confirmations', async () => {
      const response = await testClient.getBalance(6);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.balance).toBeDefined();
      expect(response.data.data.minConfirmations).toBe(6);
    });

    it('should return balance with 0 confirmations (including unconfirmed)', async () => {
      const response = await testClient.getBalance(0);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.balance).toBeDefined();
      expect(response.data.data.minConfirmations).toBe(0);
    });
  });

  describe('POST /api/zcash/wallet/newaddress', () => {
    it('should generate a new address', async () => {
      const response = await testClient.getNewAddress();

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.address).toBeDefined();
      expect(typeof response.data.data.address).toBe('string');
      expect(response.data.data.address.length).toBeGreaterThan(0);
    });

    it('should generate a new address with account name', async () => {
      const response = await testClient.getNewAddress('test-account');

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.address).toBeDefined();
    });

    it('should generate unique addresses on multiple calls', async () => {
      const response1 = await testClient.getNewAddress();

      // Add delay before second request to avoid rate limiting
      await delay(1000);

      const response2 = await testClient.getNewAddress();

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
      expect(response1.data.data.address).not.toBe(response2.data.data.address);
    });
  });

  describe('GET /api/zcash/wallet/unspent', () => {
    it('should list unspent transactions with default parameters', async () => {
      const response = await testClient.listUnspent();

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
    });

    it('should list unspent with custom min confirmations', async () => {
      const response = await testClient.listUnspent(6);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
    });

    it('should list unspent with min and max confirmations', async () => {
      const response = await testClient.listUnspent(1, 100);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
    });

    it('should validate unspent transaction structure if any exist', async () => {
      const response = await testClient.listUnspent();

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data.data)).toBe(true);

      if (response.data.data.length > 0) {
        const utxo = response.data.data[0];
        expect(utxo.txid).toBeDefined();
        expect(utxo.vout).toBeDefined();
        expect(utxo.address).toBeDefined();
        expect(utxo.amount).toBeDefined();
        expect(typeof utxo.amount).toBe('number');
        expect(utxo.confirmations).toBeDefined();
      }
    });
  });

  describe('GET /api/zcash/address/validate/:address', () => {
    let validAddress: string;

    beforeAll(async () => {
      // Generate a valid address for testing
      const response = await testClient.getNewAddress();
      validAddress = response.data.data.address;
    });

    it('should validate a valid address', async () => {
      const response = await testClient.validateAddress(validAddress);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toBeDefined();
      expect(response.data.data.isvalid).toBe(true);
      expect(response.data.data.address).toBe(validAddress);
    });

    it('should invalidate an invalid address', async () => {
      const invalidAddress = 'invalid-zcash-address-12345';
      const response = await testClient.validateAddress(invalidAddress);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.isvalid).toBe(false);
    });

    it('should handle empty address', async () => {
      const response = await testClient.validateAddress('');

      expect(response.status).toBe(200);
      expect(response.data.data.isvalid).toBe(false);
    });
  });
});
