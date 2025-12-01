import testClient from "../utils/testClient";

// Helper function to add delay between tests to avoid rate limiting
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe("Transaction Endpoints", () => {
  // Add delay between each test to avoid rate limiting
  beforeEach(async () => {
    await delay(1000); // 1 second delay between tests
  });
  describe("GET /api/zcash/transactions", () => {
    it("should list transactions with default parameters", async () => {
      const response = await testClient.listTransactions();

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
    });

    it("should list transactions with custom count", async () => {
      const response = await testClient.listTransactions(5);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
      expect(response.data.data.length).toBeLessThanOrEqual(5);
    });

    it("should list transactions with count and skip", async () => {
      const response = await testClient.listTransactions(10, 5);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
    });

    it("should validate transaction structure if any exist", async () => {
      const response = await testClient.listTransactions(100);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data.data)).toBe(true);

      if (response.data.data.length > 0) {
        const tx = response.data.data[0];
        expect(tx.txid).toBeDefined();
        expect(typeof tx.txid).toBe("string");
        expect(tx.amount).toBeDefined();
        expect(typeof tx.amount).toBe("number");
        expect(tx.confirmations).toBeDefined();
      }
    });
  });

  describe("GET /api/zcash/transaction/:txid", () => {
    let testTxid: string | null = null;

    beforeAll(async () => {
      // Try to get a recent transaction to test with
      const txListResponse = await testClient.listTransactions(1);
      if (txListResponse.data.data && txListResponse.data.data.length > 0) {
        testTxid = txListResponse.data.data[0].txid;
      }
    });

    it("should return transaction details for valid txid", async () => {
      if (!testTxid) {
        console.log("Skipping test - no transactions available");
        return;
      }

      const response = await testClient.getTransaction(testTxid);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toBeDefined();
      expect(response.data.data.txid).toBe(testTxid);
      expect(response.data.data.amount).toBeDefined();
      expect(response.data.data.confirmations).toBeDefined();
    });

    it("should handle invalid transaction id", async () => {
      const invalidTxid =
        "0000000000000000000000000000000000000000000000000000000000000000";
      const response = await testClient.getTransaction(invalidTxid);

      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.data.success).toBe(false);
    });

    it("should handle malformed transaction id", async () => {
      const malformedTxid = "invalid-txid";
      const response = await testClient.getTransaction(malformedTxid);

      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.data.success).toBe(false);
    });
  });

  describe("GET /api/zcash/transaction/:txid/raw", () => {
    let testTxid: string | null = null;

    beforeAll(async () => {
      // Try to get a recent transaction to test with
      const txListResponse = await testClient.listTransactions(1);
      if (txListResponse.data.data && txListResponse.data.data.length > 0) {
        testTxid = txListResponse.data.data[0].txid;
      }
    });

    it("should return raw transaction (non-verbose)", async () => {
      if (!testTxid) {
        console.log("Skipping test - no transactions available");
        return;
      }

      const response = await testClient.getRawTransaction(testTxid, false);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(typeof response.data.data).toBe("string");
      expect(response.data.data.length).toBeGreaterThan(0);
    });

    it("should return raw transaction (verbose)", async () => {
      if (!testTxid) {
        console.log("Skipping test - no transactions available");
        return;
      }

      const response = await testClient.getRawTransaction(testTxid, true);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(typeof response.data.data).toBe("object");
      expect(response.data.data.txid).toBeDefined();
    });

    it("should handle invalid txid for raw transaction", async () => {
      const invalidTxid =
        "0000000000000000000000000000000000000000000000000000000000000000";
      const response = await testClient.getRawTransaction(invalidTxid);

      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.data.success).toBe(false);
    });
  });

  describe("POST /api/zcash/transaction/send", () => {
    it("should reject send request without required fields", async () => {
      const response = await testClient.sendToAddress("", 0);

      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
      expect(response.data.error).toContain("required");
    });

    it("should reject send to invalid address", async () => {
      const response = await testClient.sendToAddress("invalid-address", 0.001);

      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.data.success).toBe(false);
    });

    it("should reject send with negative amount", async () => {
      const addressResponse = await testClient.getNewAccount();
      const validAddress = addressResponse.data.data.address;

      // Add delay before next request to avoid rate limiting
      await delay(1000);

      const response = await testClient.sendToAddress(validAddress, -0.001);

      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.data.success).toBe(false);
    });

    // Note: Actual successful send test is commented out to prevent spending funds during testing
    // Uncomment and modify if you want to test actual transactions
    /*
    it('should successfully send to valid address', async () => {
      const addressResponse = await testClient.getNewAccount();
      const validAddress = addressResponse.data.data.address;

      const response = await testClient.sendToAddress(validAddress, 0.001, 'Test transaction');

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.txid).toBeDefined();
      expect(typeof response.data.data.txid).toBe('string');
      expect(response.data.data.txid.length).toBe(64);
    });
    */
  });

  describe("GET /api/zcash/fee/estimate", () => {
    it("should estimate fee with default blocks", async () => {
      const response = await testClient.estimateFee();

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.fee).toBeDefined();
      expect(response.data.data.nblocks).toBe(6);
    });

    it("should estimate fee with custom blocks", async () => {
      const response = await testClient.estimateFee(2);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.fee).toBeDefined();
      expect(response.data.data.nblocks).toBe(2);
    });

    it("should handle various block counts", async () => {
      const blockCounts = [1, 3, 6, 10, 20];

      for (let i = 0; i < blockCounts.length; i++) {
        const blocks = blockCounts[i];
        const response = await testClient.estimateFee(blocks);

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
        expect(response.data.data.nblocks).toBe(blocks);

        // Add delay between requests in the loop to avoid rate limiting
        if (i < blockCounts.length - 1) {
          await delay(1000);
        }
      }
    });
  });
});
