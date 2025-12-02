# Client-Side Wallet Extension Integration Guide

This document provides comprehensive instructions for integrating a client-side wallet extension with the Zcash API backend. The wallet extension will handle private key management locally using **WebZjs** while interacting with the API for blockchain operations.

## Quick Start

**Technology Stack:**
- **[WebZjs](https://github.com/ChainSafe/WebZjs)** - WebAssembly library for Zcash in browsers
- **[bip39](https://www.npmjs.com/package/bip39)** - BIP39 mnemonic seed phrase generation
- **Your Zcash API** - Backend for blockchain queries and transaction broadcasting

**Installation:**
```bash
npm install @chainsafe/webzjs bip39
```

**Core Workflow:**
1. Generate BIP39 seed phrase → Store encrypted locally
2. Use WebZjs to derive Zcash addresses (transparent, Sapling, Orchard, unified)
3. Query balances from API → Display to user
4. Build transactions with API (`z_sendmany`) → Monitor completion
5. (Optional) Build and sign transactions client-side with WebZjs for maximum privacy

---

## Table of Contents

1. [Overview](#overview)
2. [Account Management & Balance Retrieval](#account-management--balance-retrieval)
3. [Transaction Instructions (z_sendmany)](#transaction-instructions-z_sendmany)
4. [Client-Side Key Management](#client-side-key-management)
5. [Security Considerations](#security-considerations)
6. [Implementation Checklist](#implementation-checklist)

---

## Overview

### Architecture

The client-side wallet extension operates in two modes:

1. **Server-Managed Wallet Mode**: The Zcash node manages keys server-side. The extension queries balances and initiates transactions via API calls.
2. **Client-Managed Wallet Mode** (Recommended): The extension manages keys locally using seed phrases, derives addresses using WebZjs, and optionally signs transactions client-side before broadcasting.

This guide covers both approaches, with **emphasis on using WebZjs for client-side key management** for enhanced privacy and security.

### Key Technologies

**WebZjs** - The core library for client-side Zcash operations:
- **Repository:** https://github.com/ChainSafe/WebZjs
- **Type:** WebAssembly-based library for browser environments
- **Purpose:** Native Zcash support in browsers without server-side key management
- **Key Features:**
  - Full ZIP32 support for hierarchical deterministic key derivation
  - Generate transparent, Sapling, and Orchard addresses from seed phrases
  - Unified address generation (u-addr with multiple receivers)
  - Transaction building and signing for all pool types
  - No server-side key storage required

### Key Components

- **Seed Phrase Management**: BIP39 mnemonic generation and storage (using `bip39` library)
- **Key Derivation**: ZIP32 hierarchical deterministic key derivation (using WebZjs)
- **Address Types**:
  - Transparent (t-addr) - BIP44 derivation
  - Shielded Sapling (z-addr) - ZIP32 derivation
  - Unified (u-addr) - ZIP32 with multiple receivers (Orchard, Sapling, Transparent)
- **Transaction Building**: Client-side transaction construction with WebZjs (optional)
- **API Integration**: Broadcasting transactions and querying blockchain state

### Recommended Architecture: Hybrid Approach

**Client-Side (WebZjs):**
- Generate and store encrypted seed phrases
- Derive all address types from seed
- Manage private keys securely in browser
- Optionally: Build and sign transactions

**Server-Side (Your API):**
- Query blockchain state and balances
- Broadcast transactions via `z_sendmany`
- Handle fee estimation and UTXO selection
- Monitor transaction confirmations

**Benefits:**
- ✅ Private keys never leave the user's device
- ✅ No server-side key storage required
- ✅ Full privacy and security for users
- ✅ Simplified transaction logic (API handles complexity)
- ✅ Works with existing Zcash node infrastructure

---

## Account Management & Balance Retrieval

### 1. Understanding Zcash Account Structure

Zcash wallets support multiple account types with different privacy characteristics:

#### Account Types & Pools

1. **Transparent Pool** (`transparent`)
   - Similar to Bitcoin addresses
   - Addresses start with `t1` (mainnet) or `tm` (testnet)
   - Fully visible on blockchain
   - Best for: Exchange deposits, regulatory compliance

2. **Sapling Pool** (`sapling`)
   - Shielded addresses starting with `zs`
   - Zero-knowledge proofs for privacy
   - Encrypted transaction amounts and addresses
   - Best for: Private transactions, standard shielded operations

3. **Orchard Pool** (`orchard`)
   - Latest shielded pool (NU5+)
   - Improved performance and privacy
   - Part of unified addresses
   - Best for: Modern shielded operations

4. **Unified Addresses** (`u-addr`)
   - Starts with `u1`
   - Contains multiple receivers (transparent, sapling, orchard)
   - Single address that can receive to any pool
   - Best for: User-facing wallet addresses

### 2. Listing Accounts

#### Endpoint: `GET /api/v1/zcash/wallet/listaccounts`

Returns all accounts created with `z_getnewaccount`.

**Example Request:**
```javascript
const response = await fetch('http://localhost:3000/api/v1/zcash/wallet/listaccounts', {
  method: 'GET',
  headers: {
    'x-api-key': 'your-api-key',
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
console.log(data);
// {
//   "success": true,
//   "data": [
//     { "account": 0 },
//     { "account": 1 },
//     { "account": 2 }
//   ]
// }
```

### 3. Getting Account Address

#### Endpoint: `POST /api/v1/zcash/wallet/getaddressforaccount`

Retrieves the unified address for a specific account.

**Request Body:**
```json
{
  "account": 0,
  "diversifierIndex": null  // Optional: for address diversification
}
```

**Example:**
```javascript
const response = await fetch('http://localhost:3000/api/v1/zcash/wallet/getaddressforaccount', {
  method: 'POST',
  headers: {
    'x-api-key': 'your-api-key',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    account: 0
  })
});

const data = await response.json();
console.log(data);
// {
//   "success": true,
//   "data": {
//     "account": 0,
//     "address": "u1abc123...",
//     "receiverTypes": ["orchard", "sapling", "p2pkh"]
//   }
// }
```

**Receiver Types:**
- `p2pkh`: Transparent receiver (compatible with t-addresses)
- `sapling`: Sapling shielded receiver
- `orchard`: Orchard shielded receiver

### 4. Getting Balance by Pool

#### Endpoint: `POST /api/v1/zcash/wallet/getbalanceforaccount`

Returns balance breakdown across all pools for an account.

**Request Body:**
```json
{
  "account": 0,
  "minconf": 1,        // Minimum confirmations (optional, default: 1)
  "asOfHeight": null   // Optional: balance at specific block height
}
```

**Example:**
```javascript
const response = await fetch('http://localhost:3000/api/v1/zcash/wallet/getbalanceforaccount', {
  method: 'POST',
  headers: {
    'x-api-key': 'your-api-key',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    account: 0,
    minconf: 1
  })
});

const data = await response.json();
console.log(data);
// {
//   "success": true,
//   "data": {
//     "pools": {
//       "transparent": {
//         "valueZat": 150000000  // 1.5 ZEC in zatoshis
//       },
//       "sapling": {
//         "valueZat": 320000000  // 3.2 ZEC
//       },
//       "orchard": {
//         "valueZat": 580000000  // 5.8 ZEC
//       }
//     },
//     "minimum_confirmations": 1
//   }
// }
```

**Converting Zatoshis to ZEC:**
```javascript
function zatoshiToZEC(zatoshi) {
  return zatoshi / 100000000;
}

const pools = data.data.pools;
const balances = {
  transparent: zatoshiToZEC(pools.transparent?.valueZat || 0),
  sapling: zatoshiToZEC(pools.sapling?.valueZat || 0),
  orchard: zatoshiToZEC(pools.orchard?.valueZat || 0)
};
balances.total = balances.transparent + balances.sapling + balances.orchard;

console.log(balances);
// {
//   transparent: 1.5,
//   sapling: 3.2,
//   orchard: 5.8,
//   total: 10.5
// }
```

### 5. Complete Balance Display Example

```javascript
class WalletBalanceManager {
  constructor(apiClient) {
    this.apiClient = apiClient;
  }

  async getAllAccountBalances() {
    // Get all accounts
    const accountsResponse = await this.apiClient.get('/api/v1/zcash/wallet/listaccounts');
    const accounts = accountsResponse.data;

    // Get balance and address for each account
    const accountDetails = await Promise.all(
      accounts.map(async (acc) => {
        const [addressData, balanceData] = await Promise.all([
          this.apiClient.post('/api/v1/zcash/wallet/getaddressforaccount', {
            account: acc.account
          }),
          this.apiClient.post('/api/v1/zcash/wallet/getbalanceforaccount', {
            account: acc.account,
            minconf: 1
          })
        ]);

        const pools = balanceData.data.pools;
        const balances = {
          transparent: this.zatoshiToZEC(pools.transparent?.valueZat || 0),
          sapling: this.zatoshiToZEC(pools.sapling?.valueZat || 0),
          orchard: this.zatoshiToZEC(pools.orchard?.valueZat || 0)
        };
        balances.total = balances.transparent + balances.sapling + balances.orchard;

        return {
          account: acc.account,
          address: addressData.data.address,
          receiverTypes: addressData.data.receiverTypes,
          balances: balances
        };
      })
    );

    return accountDetails;
  }

  zatoshiToZEC(zatoshi) {
    return zatoshi / 100000000;
  }
}
```

---

## Transaction Instructions (z_sendmany)

The `z_sendmany` RPC call is the universal method for sending ZEC. It supports all transaction types: transparent-to-transparent, transparent-to-shielded, shielded-to-transparent, and shielded-to-shielded.

### Endpoint: `POST /api/v1/zcash/transaction/z_sendmany`

### Privacy Policies

Choose the appropriate privacy policy based on your transaction type:

| Policy | Description | Use Case |
|--------|-------------|----------|
| `FullPrivacy` | Fully shielded transaction | Shielded → Shielded |
| `LegacyCompat` | Compatible with older wallets | Legacy compatibility |
| `AllowRevealedAmounts` | Amounts may be visible | Specific privacy trade-offs |
| `AllowRevealedRecipients` | Recipients may be visible | Deshielding funds |
| `AllowRevealedSenders` | Senders may be visible | Shielding funds |
| `AllowFullyTransparent` | Transparent transaction | Transparent → Transparent |
| `AllowLinkingAccountAddresses` | Allow address linking | Internal transfers |
| `NoPrivacy` | No privacy restrictions | Any combination |

### Transaction Type Examples

#### 1. Transparent → Transparent

**Use Case:** Send from transparent address to another transparent address (like Bitcoin).

**Privacy Policy:** `AllowFullyTransparent`

**Example:**
```javascript
const response = await fetch('http://localhost:3000/api/v1/zcash/transaction/z_sendmany', {
  method: 'POST',
  headers: {
    'x-api-key': 'your-api-key',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    fromAddress: "tmYXBYJj1K7vhejSec5osXK2QsGa5MTisUQ",  // Transparent sender
    recipients: [
      {
        address: "tmRecipient123...",  // Transparent recipient
        amount: 0.5
      }
    ],
    minconf: 1,
    privacyPolicy: "AllowFullyTransparent"
  })
});

const data = await response.json();
// Returns: { "success": true, "data": { "operationId": "opid-..." } }
```

**Characteristics:**
- Fully visible on blockchain
- Sender, recipient, and amount are public
- Lowest transaction fee
- Fastest confirmation
- No privacy protection

#### 2. Transparent → Shielded (Shielding)

**Use Case:** Move funds from transparent pool to shielded pool for privacy.

**Privacy Policy:** `AllowRevealedSenders`

**Example:**
```javascript
const response = await fetch('http://localhost:3000/api/v1/zcash/transaction/z_sendmany', {
  method: 'POST',
  headers: {
    'x-api-key': 'your-api-key',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    fromAddress: "tmYXBYJj1K7vhejSec5osXK2QsGa5MTisUQ",  // Transparent sender
    recipients: [
      {
        address: "u1orchardorsampling...",  // Unified or shielded recipient
        amount: 1.25,
        memo: ""  // Optional memo (hex encoded)
      }
    ],
    minconf: 1,
    privacyPolicy: "AllowRevealedSenders"
  })
});
```

**Characteristics:**
- Sender address is visible
- Recipient address and amount are shielded
- Funds move from transparent to shielded pool
- Good for initial privacy setup

#### 3. Shielded → Transparent (Deshielding)

**Use Case:** Move funds from shielded pool to transparent address (e.g., for exchange deposit).

**Privacy Policy:** `AllowRevealedRecipients`

**Example:**
```javascript
const response = await fetch('http://localhost:3000/api/v1/zcash/transaction/z_sendmany', {
  method: 'POST',
  headers: {
    'x-api-key': 'your-api-key',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    fromAddress: "u1orchardaddress...",  // Unified/shielded sender
    recipients: [
      {
        address: "tmExchangeDeposit...",  // Transparent recipient
        amount: 2.0
      }
    ],
    minconf: 1,
    privacyPolicy: "AllowRevealedRecipients"
  })
});
```

**Characteristics:**
- Sender address is shielded
- Recipient address and amount are visible
- Required for exchange deposits
- Reveals final destination

#### 4. Shielded → Shielded (Full Privacy)

**Use Case:** Private transfer between shielded addresses with maximum privacy.

**Privacy Policy:** `FullPrivacy`

**Example:**
```javascript
const response = await fetch('http://localhost:3000/api/v1/zcash/transaction/z_sendmany', {
  method: 'POST',
  headers: {
    'x-api-key': 'your-api-key',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    fromAddress: "u1sendershielded...",  // Unified/shielded sender
    recipients: [
      {
        address: "u1recipientshielded...",  // Unified/shielded recipient
        amount: 0.75,
        memo: "5061796d656e74"  // Optional: "Payment" in hex
      }
    ],
    minconf: 1,
    privacyPolicy: "FullPrivacy"
  })
});
```

**Characteristics:**
- Complete privacy protection
- Sender, recipient, and amount are encrypted
- Zero-knowledge proofs verify transaction validity
- Highest privacy level
- Slightly higher fee than transparent

#### 5. Multiple Recipients (Batching)

**Use Case:** Send to multiple addresses in a single transaction.

**Example:**
```javascript
const response = await fetch('http://localhost:3000/api/v1/zcash/transaction/z_sendmany', {
  method: 'POST',
  headers: {
    'x-api-key': 'your-api-key',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    fromAddress: "u1sender...",
    recipients: [
      {
        address: "u1recipient1...",
        amount: 0.5,
        memo: "4669727374"  // "First" in hex
      },
      {
        address: "tmRecipient2...",
        amount: 0.3
      },
      {
        address: "u1recipient3...",
        amount: 0.2,
        memo: "5468697264"  // "Third" in hex
      }
    ],
    minconf: 1,
    privacyPolicy: "AllowRevealedRecipients",  // Mixed transaction
    fee: 0.0001  // Optional: specify custom fee
  })
});
```

**Benefits:**
- Single transaction fee for multiple payments
- More efficient than individual transactions
- Useful for payroll, distributions, or batch payments

### Monitoring Transaction Status

Since `z_sendmany` is asynchronous, you must poll for completion:

#### Step 1: Get Operation Status

**Endpoint:** `POST /api/v1/zcash/transaction/z_getoperationstatus`

```javascript
async function checkOperationStatus(operationId) {
  const response = await fetch('http://localhost:3000/api/v1/zcash/transaction/z_getoperationstatus', {
    method: 'POST',
    headers: {
      'x-api-key': 'your-api-key',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      operationIds: [operationId]
    })
  });

  const data = await response.json();
  return data.data[0];  // Returns operation object
}

// Operation statuses: 'queued', 'executing', 'success', 'failed', 'cancelled'
```

#### Step 2: Wait for Completion

```javascript
async function waitForOperation(operationId, maxAttempts = 30, pollInterval = 2000) {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(resolve => setTimeout(resolve, pollInterval));

    const operation = await checkOperationStatus(operationId);

    if (!operation) {
      throw new Error('Operation not found');
    }

    console.log(`Status: ${operation.status}`);

    if (operation.status === 'success') {
      return {
        success: true,
        txid: operation.result.txid
      };
    } else if (operation.status === 'failed') {
      throw new Error(`Transaction failed: ${operation.error?.message || 'Unknown error'}`);
    }

    // Continue waiting if status is 'queued' or 'executing'
  }

  throw new Error('Operation timed out after ' + (maxAttempts * pollInterval / 1000) + ' seconds');
}

// Usage
const sendResponse = await fetch(/* z_sendmany request */);
const sendData = await sendResponse.json();
const operationId = sendData.data.operationId;

console.log('Transaction initiated:', operationId);

const result = await waitForOperation(operationId);
console.log('Transaction confirmed:', result.txid);
```

### Complete Transaction Flow Example

```javascript
class ZcashTransactionManager {
  constructor(apiClient) {
    this.apiClient = apiClient;
  }

  async sendTransaction(fromAddress, toAddress, amount, options = {}) {
    const {
      memo = '',
      privacyPolicy = 'FullPrivacy',
      minconf = 1,
      fee = null
    } = options;

    // 1. Validate addresses
    const [fromValidation, toValidation] = await Promise.all([
      this.validateAddress(fromAddress),
      this.validateAddress(toAddress)
    ]);

    if (!fromValidation.isvalid) {
      throw new Error('Invalid sender address');
    }
    if (!toValidation.isvalid) {
      throw new Error('Invalid recipient address');
    }

    // 2. Initiate transaction
    const requestBody = {
      fromAddress,
      recipients: [{ address: toAddress, amount, memo }],
      minconf,
      privacyPolicy
    };

    if (fee !== null) {
      requestBody.fee = fee;
    }

    const sendResponse = await this.apiClient.post(
      '/api/v1/zcash/transaction/z_sendmany',
      requestBody
    );

    const operationId = sendResponse.data.operationId;

    // 3. Wait for completion
    const result = await this.waitForOperation(operationId);

    return result;
  }

  async validateAddress(address) {
    const response = await this.apiClient.get(`/api/v1/zcash/address/validate/${address}`);
    return response.data;
  }

  async waitForOperation(operationId, maxAttempts = 30, pollInterval = 2000) {
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(resolve => setTimeout(resolve, pollInterval));

      const statusResponse = await this.apiClient.post(
        '/api/v1/zcash/transaction/z_getoperationstatus',
        { operationIds: [operationId] }
      );

      const operation = statusResponse.data[0];

      if (operation.status === 'success') {
        return {
          success: true,
          txid: operation.result.txid
        };
      } else if (operation.status === 'failed') {
        throw new Error(operation.error?.message || 'Transaction failed');
      }
    }

    throw new Error('Transaction timed out');
  }
}
```

---

## Client-Side Key Management

For a truly non-custodial wallet, the extension must manage private keys locally. This section covers key generation, derivation, and transaction signing.

### 1. Seed Phrase Generation (BIP39)

#### Overview
- **Standard:** BIP39 (Bitcoin Improvement Proposal 39)
- **Purpose:** Human-readable backup of wallet entropy
- **Format:** 12, 15, 18, 21, or 24 words from standardized wordlist
- **Languages:** Multiple wordlists available (English, Spanish, Chinese, etc.)

#### Implementation with WebZjs

**WebZjs** is a WebAssembly-based library specifically designed for Zcash in browser environments. It provides comprehensive support for Zcash-specific operations including ZIP32 key derivation, Sapling and Orchard address generation, and transaction building.

**GitHub:** https://github.com/ChainSafe/WebZjs

**Required Libraries:**
```bash
npm install @chainsafe/webzjs bip39
```

**Generating a New Seed Phrase:**
```javascript
import * as bip39 from 'bip39';
import { WebZjs } from '@chainsafe/webzjs';

class ZcashWalletKeyManager {
  constructor() {
    this.webzjs = null;
  }

  // Initialize WebZjs (must be called before using)
  async initialize() {
    this.webzjs = await WebZjs.create();
    console.log('WebZjs initialized successfully');
  }

  // Generate new 24-word seed phrase
  generateSeedPhrase(strength = 256) {
    // Strength: 128 = 12 words, 256 = 24 words
    const mnemonic = bip39.generateMnemonic(strength);
    return mnemonic;
  }

  // Validate existing seed phrase
  validateSeedPhrase(mnemonic) {
    return bip39.validateMnemonic(mnemonic);
  }

  // Convert mnemonic to seed (binary)
  mnemonicToSeed(mnemonic, password = '') {
    // Password is optional BIP39 passphrase (25th word)
    return bip39.mnemonicToSeedSync(mnemonic, password);
  }

  // Get seed as hex string
  mnemonicToSeedHex(mnemonic, password = '') {
    const seed = this.mnemonicToSeed(mnemonic, password);
    return seed.toString('hex');
  }
}

// Example usage
async function initializeWallet() {
  const keyManager = new ZcashWalletKeyManager();

  // Initialize WebZjs (required before any operations)
  await keyManager.initialize();

  // Generate new wallet
  const seedPhrase = keyManager.generateSeedPhrase();
  console.log('IMPORTANT: Write down your seed phrase:');
  console.log(seedPhrase);
  // Example output: "witch collapse practice feed shame open despair creek road again ice least"

  // Validate seed phrase
  const isValid = keyManager.validateSeedPhrase(seedPhrase);
  console.log('Is valid:', isValid);  // true

  // Convert to seed bytes
  const seed = keyManager.mnemonicToSeed(seedPhrase);
  console.log('Seed (hex):', keyManager.mnemonicToSeedHex(seedPhrase));

  return { keyManager, seedPhrase };
}
```

### 2. Key Derivation with WebZjs (ZIP32 for Zcash)

#### Derivation Paths

Zcash uses ZIP32 (Zcash Improvement Proposal 32) for hierarchical deterministic key derivation:

| Purpose | Path | Description |
|---------|------|-------------|
| Transparent | `m/44'/133'/0'` | BIP44 for Zcash transparent (coin type 133) |
| Sapling | `m/32'/133'/0'` | ZIP32 for Sapling shielded addresses |
| Orchard | `m/32'/133'/account'` | ZIP32 for Orchard (unified addresses) |

**Important Notes:**
- Transparent addresses use BIP44 (compatible with Bitcoin derivation)
- Shielded addresses (Sapling/Orchard) use ZIP32 (Zcash-specific)
- Account index starts at 0
- Hardened derivation indicated by `'` (e.g., `0'`)

#### Complete Key Derivation with WebZjs

WebZjs provides native support for deriving all Zcash address types from a seed phrase, including transparent, Sapling, and Orchard addresses.

```javascript
import * as bip39 from 'bip39';
import { WebZjs } from '@chainsafe/webzjs';

class ZcashKeyDerivation {
  constructor() {
    this.webzjs = null;
    this.seed = null;
    this.network = 'testnet'; // or 'mainnet'
  }

  // Initialize WebZjs
  async initialize() {
    this.webzjs = await WebZjs.create();
  }

  // Set seed from mnemonic
  setSeedFromMnemonic(mnemonic, password = '') {
    this.seed = bip39.mnemonicToSeedSync(mnemonic, password);
  }

  // Derive transparent address (P2PKH)
  async deriveTransparentAddress(accountIndex = 0, addressIndex = 0) {
    if (!this.webzjs || !this.seed) {
      throw new Error('WebZjs not initialized or seed not set');
    }

    // BIP44 path: m/44'/133'/account'/0/addressIndex
    const derivationPath = [
      44 | 0x80000000,  // Purpose (hardened)
      133 | 0x80000000, // Coin type for Zcash (hardened)
      accountIndex | 0x80000000, // Account (hardened)
      0,                // Change (0 = external, 1 = internal)
      addressIndex      // Address index
    ];

    try {
      const address = await this.webzjs.deriveTransparentAddress(
        this.seed,
        derivationPath,
        this.network
      );

      return {
        address: address,
        type: 'transparent',
        path: `m/44'/133'/${accountIndex}'/0/${addressIndex}`,
        accountIndex,
        addressIndex
      };
    } catch (error) {
      console.error('Error deriving transparent address:', error);
      throw error;
    }
  }

  // Derive Sapling address
  async deriveSaplingAddress(accountIndex = 0, diversifierIndex = 0) {
    if (!this.webzjs || !this.seed) {
      throw new Error('WebZjs not initialized or seed not set');
    }

    // ZIP32 path for Sapling: m/32'/133'/account'
    try {
      const address = await this.webzjs.deriveSaplingAddress(
        this.seed,
        accountIndex,
        diversifierIndex,
        this.network
      );

      return {
        address: address,
        type: 'sapling',
        path: `m/32'/133'/${accountIndex}'`,
        accountIndex,
        diversifierIndex
      };
    } catch (error) {
      console.error('Error deriving Sapling address:', error);
      throw error;
    }
  }

  // Derive unified address (includes Orchard, Sapling, and Transparent receivers)
  async deriveUnifiedAddress(accountIndex = 0) {
    if (!this.webzjs || !this.seed) {
      throw new Error('WebZjs not initialized or seed not set');
    }

    try {
      const address = await this.webzjs.deriveUnifiedAddress(
        this.seed,
        accountIndex,
        this.network
      );

      return {
        address: address,
        type: 'unified',
        path: `m/32'/133'/${accountIndex}'`,
        accountIndex,
        // Unified addresses contain multiple receivers:
        // - Orchard (latest shielded protocol)
        // - Sapling (previous shielded protocol)
        // - Transparent (P2PKH)
        receiverTypes: ['orchard', 'sapling', 'p2pkh']
      };
    } catch (error) {
      console.error('Error deriving unified address:', error);
      throw error;
    }
  }

  // Derive spending keys for transaction signing
  async deriveSpendingKeys(accountIndex = 0) {
    if (!this.webzjs || !this.seed) {
      throw new Error('WebZjs not initialized or seed not set');
    }

    try {
      // Derive keys for all pool types
      const keys = await this.webzjs.deriveSpendingKeys(
        this.seed,
        accountIndex,
        this.network
      );

      return {
        transparentKey: keys.transparent,
        saplingKey: keys.sapling,
        orchardKey: keys.orchard,
        accountIndex
      };
    } catch (error) {
      console.error('Error deriving spending keys:', error);
      throw error;
    }
  }

  // Derive multiple addresses for account discovery
  async deriveMultipleAddresses(accountIndex = 0, count = 5) {
    const addresses = {
      transparent: [],
      sapling: [],
      unified: null
    };

    // Derive transparent addresses
    for (let i = 0; i < count; i++) {
      const addr = await this.deriveTransparentAddress(accountIndex, i);
      addresses.transparent.push(addr);
    }

    // Derive Sapling addresses with different diversifiers
    for (let i = 0; i < count; i++) {
      const addr = await this.deriveSaplingAddress(accountIndex, i);
      addresses.sapling.push(addr);
    }

    // Derive unified address (typically one per account)
    addresses.unified = await this.deriveUnifiedAddress(accountIndex);

    return addresses;
  }
}

// Example usage
async function demonstrateKeyDerivation() {
  const seedPhrase = "witch collapse practice feed shame open despair creek road again ice least";

  // Initialize key derivation
  const keyDerivation = new ZcashKeyDerivation();
  await keyDerivation.initialize();
  keyDerivation.setSeedFromMnemonic(seedPhrase);

  console.log('=== Zcash Address Derivation with WebZjs ===\n');

  // Derive transparent address
  const transparentAddr = await keyDerivation.deriveTransparentAddress(0, 0);
  console.log('Transparent Address:');
  console.log('  Address:', transparentAddr.address);  // tmXXXXXXXX...
  console.log('  Path:', transparentAddr.path);
  console.log('  Type:', transparentAddr.type);
  console.log();

  // Derive Sapling shielded address
  const saplingAddr = await keyDerivation.deriveSaplingAddress(0, 0);
  console.log('Sapling Address:');
  console.log('  Address:', saplingAddr.address);  // zsXXXXXXXX...
  console.log('  Path:', saplingAddr.path);
  console.log('  Type:', saplingAddr.type);
  console.log();

  // Derive unified address (RECOMMENDED for wallets)
  const unifiedAddr = await keyDerivation.deriveUnifiedAddress(0);
  console.log('Unified Address (RECOMMENDED):');
  console.log('  Address:', unifiedAddr.address);  // u1XXXXXXXX...
  console.log('  Path:', unifiedAddr.path);
  console.log('  Receiver Types:', unifiedAddr.receiverTypes);
  console.log();

  // Derive spending keys for transaction signing
  const spendingKeys = await keyDerivation.deriveSpendingKeys(0);
  console.log('Spending Keys derived for account 0');
  console.log('  (Keys should be kept secure and never logged in production)');
  console.log();

  return {
    transparent: transparentAddr,
    sapling: saplingAddr,
    unified: unifiedAddr,
    spendingKeys
  };
}
```

#### Client-Side Transaction Building with WebZjs

WebZjs also supports building and signing transactions entirely client-side:

```javascript
class ZcashTransactionBuilder {
  constructor(webzjs, spendingKeys) {
    this.webzjs = webzjs;
    this.spendingKeys = spendingKeys;
  }

  // Build and sign a shielded transaction
  async buildShieldedTransaction(fromAddress, toAddress, amount, memo = '') {
    try {
      // Build transaction using WebZjs
      const tx = await this.webzjs.buildTransaction({
        from: fromAddress,
        to: toAddress,
        amount: amount, // in zatoshis
        memo: memo,
        spendingKeys: this.spendingKeys,
        network: 'testnet'
      });

      return {
        txHex: tx.toHex(),
        txId: tx.getId()
      };
    } catch (error) {
      console.error('Error building transaction:', error);
      throw error;
    }
  }

  // Broadcast transaction to network
  async broadcastTransaction(txHex) {
    // This would typically go through your API
    const response = await fetch('http://localhost:3000/api/v1/zcash/transaction/broadcast', {
      method: 'POST',
      headers: {
        'x-api-key': 'your-api-key',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ txHex })
    });

    const data = await response.json();
    return data.data.txid;
  }
}
```

#### Hybrid Approach: Client-Side Keys + API Transactions

For most browser wallet extensions, a hybrid approach is recommended:

```javascript
class HybridWalletManager {
  constructor(apiClient) {
    this.apiClient = apiClient;
    this.keyDerivation = null;
    this.webzjs = null;
  }

  async initialize(seedPhrase) {
    // Initialize WebZjs for key derivation
    this.keyDerivation = new ZcashKeyDerivation();
    await this.keyDerivation.initialize();
    this.keyDerivation.setSeedFromMnemonic(seedPhrase);
    this.webzjs = this.keyDerivation.webzjs;
  }

  // Derive addresses client-side
  async getAccountAddresses(accountIndex = 0) {
    return await this.keyDerivation.deriveMultipleAddresses(accountIndex, 5);
  }

  // Use API for transactions (easier, handles fee calculation)
  async sendTransaction(fromAddress, toAddress, amount, privacyPolicy) {
    // For server-managed wallet approach:
    // The API handles transaction building and signing
    const response = await this.apiClient.post('/api/v1/zcash/transaction/z_sendmany', {
      fromAddress,
      recipients: [{ address: toAddress, amount }],
      privacyPolicy
    });

    return response.data.operationId;
  }

  // Or build transactions client-side (more advanced)
  async buildAndSendTransaction(fromAddress, toAddress, amount) {
    // Derive spending keys
    const spendingKeys = await this.keyDerivation.deriveSpendingKeys(0);

    // Build transaction client-side
    const txBuilder = new ZcashTransactionBuilder(this.webzjs, spendingKeys);
    const { txHex } = await txBuilder.buildShieldedTransaction(
      fromAddress,
      toAddress,
      amount
    );

    // Broadcast through API
    return await txBuilder.broadcastTransaction(txHex);
  }
}
```

**Recommendation:**
- Use **client-side key derivation** with WebZjs for address generation and key management
- Use **API-based transactions** (z_sendmany) for transaction building and broadcasting
- This provides good security (keys never leave client) while simplifying transaction logic

### 3. Importing Private Keys

For transparent addresses, users can import existing private keys:

#### Import Transparent Private Key

**Endpoint:** `POST /api/v1/zcash/wallet/importprivkey`

```javascript
async function importTransparentKey(privateKeyWIF, label = '', rescan = false) {
  const response = await fetch('http://localhost:3000/api/v1/zcash/wallet/importprivkey', {
    method: 'POST',
    headers: {
      'x-api-key': 'your-api-key',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      privateKey: privateKeyWIF,  // WIF format
      label: label,
      rescan: rescan  // Set to true to scan blockchain for past transactions
    })
  });

  return await response.json();
}

// Example
const wif = 'cVB8jK5xXh9KqZN...';  // Private key in WIF format
await importTransparentKey(wif, 'imported-key-1', false);
```

**Parameters:**
- `privateKey`: Private key in Wallet Import Format (WIF)
- `label`: Optional label for the key
- `rescan`: If true, rescans blockchain for transactions (slow, use sparingly)

#### Export Transparent Private Key

**Endpoint:** `GET /api/v1/zcash/wallet/dumpprivkey/{address}`

```javascript
async function exportTransparentKey(address) {
  const response = await fetch(`http://localhost:3000/api/v1/zcash/wallet/dumpprivkey/${address}`, {
    method: 'GET',
    headers: {
      'x-api-key': 'your-api-key'
    }
  });

  const data = await response.json();
  return data.data.privateKey;  // Returns WIF
}

// Example
const address = 'tmYXBYJj1K7vhejSec5osXK2QsGa5MTisUQ';
const privateKey = await exportTransparentKey(address);
console.log('Private key (WIF):', privateKey);
```

### 4. Wallet Storage Architecture

**Security Model:** Seed phrase stored locally in encrypted extension storage.

#### Browser Extension Storage

```javascript
class SecureWalletStorage {
  constructor() {
    this.storageKey = 'zcash_wallet_encrypted';
  }

  // Encrypt and store seed phrase
  async storeSeedPhrase(seedPhrase, password) {
    // Derive encryption key from password
    const encryptionKey = await this.deriveKeyFromPassword(password);

    // Encrypt seed phrase
    const encrypted = await this.encrypt(seedPhrase, encryptionKey);

    // Store in browser extension storage
    await chrome.storage.local.set({
      [this.storageKey]: encrypted,
      hasWallet: true
    });
  }

  // Retrieve and decrypt seed phrase
  async retrieveSeedPhrase(password) {
    const result = await chrome.storage.local.get([this.storageKey]);

    if (!result[this.storageKey]) {
      throw new Error('No wallet found');
    }

    const encryptionKey = await this.deriveKeyFromPassword(password);
    const seedPhrase = await this.decrypt(result[this.storageKey], encryptionKey);

    return seedPhrase;
  }

  // Derive encryption key from password using PBKDF2
  async deriveKeyFromPassword(password) {
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);

    // Import password as key material
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    // Derive AES-GCM key
    const salt = await this.getSalt();
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );

    return key;
  }

  // Encrypt using AES-GCM
  async encrypt(plaintext, key) {
    const encoder = new TextEncoder();
    const plaintextBuffer = encoder.encode(plaintext);

    const iv = crypto.getRandomValues(new Uint8Array(12));

    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      plaintextBuffer
    );

    // Combine IV and ciphertext
    const combined = new Uint8Array(iv.length + ciphertext.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(ciphertext), iv.length);

    return this.bufferToBase64(combined);
  }

  // Decrypt using AES-GCM
  async decrypt(encryptedBase64, key) {
    const combined = this.base64ToBuffer(encryptedBase64);

    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);

    const plaintextBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      ciphertext
    );

    const decoder = new TextDecoder();
    return decoder.decode(plaintextBuffer);
  }

  // Helper: Get or create salt
  async getSalt() {
    const result = await chrome.storage.local.get(['wallet_salt']);

    if (result.wallet_salt) {
      return this.base64ToBuffer(result.wallet_salt);
    }

    // Create new salt
    const salt = crypto.getRandomValues(new Uint8Array(16));
    await chrome.storage.local.set({
      wallet_salt: this.bufferToBase64(salt)
    });

    return salt;
  }

  bufferToBase64(buffer) {
    return btoa(String.fromCharCode(...new Uint8Array(buffer)));
  }

  base64ToBuffer(base64) {
    const binary = atob(base64);
    const buffer = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      buffer[i] = binary.charCodeAt(i);
    }
    return buffer;
  }
}
```

#### Usage Example with WebZjs Integration

```javascript
import { WebZjs } from '@chainsafe/webzjs';
import * as bip39 from 'bip39';

// Initialize wallet with WebZjs support
const storage = new SecureWalletStorage();

// Complete wallet initialization class
class ZcashWalletManager {
  constructor() {
    this.storage = new SecureWalletStorage();
    this.keyDerivation = null;
    this.webzjs = null;
  }

  // Create new wallet
  async createNewWallet(password) {
    // Generate seed phrase
    const seedPhrase = bip39.generateMnemonic(256);

    // Display to user (MUST write down)
    console.log('WRITE DOWN YOUR SEED PHRASE:');
    console.log(seedPhrase);
    console.log('\nThis is the ONLY way to recover your wallet!');

    // Validate before storing
    if (!bip39.validateMnemonic(seedPhrase)) {
      throw new Error('Generated seed phrase is invalid');
    }

    // Encrypt and store
    await this.storage.storeSeedPhrase(seedPhrase, password);

    // Initialize WebZjs and derive first addresses
    await this.initializeFromSeed(seedPhrase);

    const addresses = await this.keyDerivation.deriveMultipleAddresses(0, 1);

    return {
      success: true,
      unified: addresses.unified,
      transparent: addresses.transparent[0],
      sapling: addresses.sapling[0]
    };
  }

  // Unlock existing wallet
  async unlockWallet(password) {
    try {
      // Retrieve and decrypt seed phrase
      const seedPhrase = await this.storage.retrieveSeedPhrase(password);

      // Validate seed phrase
      if (!bip39.validateMnemonic(seedPhrase)) {
        throw new Error('Corrupted seed phrase in storage');
      }

      // Initialize WebZjs with seed
      await this.initializeFromSeed(seedPhrase);

      // Derive addresses
      const addresses = await this.keyDerivation.deriveMultipleAddresses(0, 5);

      return {
        success: true,
        seedPhrase: seedPhrase,  // Keep in memory only, never persist
        addresses: addresses
      };
    } catch (error) {
      console.error('Unlock error:', error);
      return { success: false, error: 'Invalid password or corrupted wallet' };
    }
  }

  // Restore wallet from seed phrase
  async restoreWallet(seedPhrase, password) {
    // Validate seed phrase
    if (!bip39.validateMnemonic(seedPhrase)) {
      throw new Error('Invalid seed phrase');
    }

    // Encrypt and store
    await this.storage.storeSeedPhrase(seedPhrase, password);

    // Initialize and derive addresses
    await this.initializeFromSeed(seedPhrase);
    const addresses = await this.keyDerivation.deriveMultipleAddresses(0, 5);

    return {
      success: true,
      addresses: addresses
    };
  }

  // Initialize WebZjs from seed
  async initializeFromSeed(seedPhrase) {
    // Create key derivation instance
    this.keyDerivation = new ZcashKeyDerivation();
    await this.keyDerivation.initialize();
    this.keyDerivation.setSeedFromMnemonic(seedPhrase);
    this.webzjs = this.keyDerivation.webzjs;
  }

  // Get addresses for an account
  async getAccountAddresses(accountIndex = 0) {
    if (!this.keyDerivation) {
      throw new Error('Wallet not unlocked');
    }
    return await this.keyDerivation.deriveMultipleAddresses(accountIndex, 5);
  }

  // Lock wallet (clear sensitive data from memory)
  lockWallet() {
    this.keyDerivation = null;
    this.webzjs = null;
    // Note: In production, also clear any other sensitive data
  }
}

// Usage example
async function walletUsageExample() {
  const wallet = new ZcashWalletManager();

  // === CREATE NEW WALLET ===
  const newWallet = await wallet.createNewWallet('strong-password-123');
  console.log('New wallet created!');
  console.log('Unified Address:', newWallet.unified.address);
  console.log('Transparent Address:', newWallet.transparent.address);
  console.log('Sapling Address:', newWallet.sapling.address);

  // Lock wallet
  wallet.lockWallet();

  // === UNLOCK WALLET ===
  const unlockedWallet = await wallet.unlockWallet('strong-password-123');
  if (unlockedWallet.success) {
    console.log('Wallet unlocked successfully!');
    console.log('Available addresses:', unlockedWallet.addresses);
  }

  // === RESTORE WALLET FROM SEED ===
  const seedPhrase = "witch collapse practice feed shame open despair creek road again ice least";
  const restoredWallet = await wallet.restoreWallet(seedPhrase, 'new-password-456');
  console.log('Wallet restored!');
  console.log('Recovered addresses:', restoredWallet.addresses);

  return wallet;
}
```

### 5. Transaction Building and Signing with WebZjs

WebZjs provides comprehensive transaction building and signing capabilities for all Zcash transaction types.

#### Building Transactions Client-Side

```javascript
class ZcashTransactionManager {
  constructor(webzjs, keyDerivation) {
    this.webzjs = webzjs;
    this.keyDerivation = keyDerivation;
  }

  // Build and sign a transaction using WebZjs
  async buildTransaction(fromAccount, toAddress, amount, memo = '', privacyPolicy = 'FullPrivacy') {
    // Derive spending keys for the account
    const spendingKeys = await this.keyDerivation.deriveSpendingKeys(fromAccount);

    // Get UTXO information (would come from API or chain state)
    const utxos = await this.fetchUTXOs(fromAccount);

    // Build transaction parameters
    const txParams = {
      spendingKeys: spendingKeys,
      recipients: [
        {
          address: toAddress,
          amount: amount, // in zatoshis
          memo: memo
        }
      ],
      utxos: utxos,
      network: 'testnet',
      privacyPolicy: privacyPolicy
    };

    try {
      // Build transaction using WebZjs
      const txBuilder = await this.webzjs.createTransaction(txParams);
      const signedTx = await txBuilder.build();

      return {
        txHex: signedTx.toHex(),
        txId: signedTx.getId(),
        size: signedTx.getSize()
      };
    } catch (error) {
      console.error('Transaction building failed:', error);
      throw error;
    }
  }

  // Fetch UTXOs for an account (from API)
  async fetchUTXOs(accountIndex) {
    // Get account addresses
    const addresses = await this.keyDerivation.deriveMultipleAddresses(accountIndex, 5);

    // Fetch UTXOs from API for all addresses
    // This is a simplified example - in production, you'd query the API
    const response = await fetch('http://localhost:3000/api/v1/zcash/wallet/unspent', {
      method: 'GET',
      headers: { 'x-api-key': 'your-api-key' }
    });

    const data = await response.json();
    return data.data;
  }

  // Broadcast signed transaction
  async broadcastTransaction(txHex) {
    const response = await fetch('http://localhost:3000/api/v1/zcash/transaction/broadcast', {
      method: 'POST',
      headers: {
        'x-api-key': 'your-api-key',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ txHex })
    });

    const data = await response.json();
    return data.data.txid;
  }
}
```

#### Recommended Approach: Hybrid Model

**For most browser wallet extensions, we recommend a hybrid approach:**

1. **Client-Side (using WebZjs):**
   - Seed phrase generation and storage
   - Key derivation for all address types
   - Address generation
   - Optionally: Transaction signing for maximum privacy

2. **Server-Side (using API):**
   - Transaction building and broadcasting via `z_sendmany`
   - Fee estimation
   - UTXO selection
   - Blockchain state queries

**Benefits of Hybrid Approach:**
- **Security:** Private keys never leave the client
- **Simplicity:** API handles complex transaction logic and fee calculation
- **Performance:** Server has full blockchain access for UTXO selection
- **Compatibility:** Works with existing Zcash node infrastructure

**Example: Hybrid Wallet Implementation**

```javascript
class HybridZcashWallet {
  constructor(apiClient) {
    this.apiClient = apiClient;
    this.keyManager = null;
    this.webzjs = null;
  }

  // Initialize wallet (call after unlocking)
  async initialize(seedPhrase) {
    const keyDerivation = new ZcashKeyDerivation();
    await keyDerivation.initialize();
    keyDerivation.setSeedFromMnemonic(seedPhrase);

    this.keyManager = keyDerivation;
    this.webzjs = keyDerivation.webzjs;
  }

  // Derive addresses client-side
  async getAddresses(accountIndex = 0) {
    return await this.keyManager.deriveMultipleAddresses(accountIndex, 5);
  }

  // Send transaction using API (recommended for most use cases)
  async sendTransactionAPI(fromAddress, toAddress, amount, privacyPolicy = 'FullPrivacy') {
    const response = await this.apiClient.post('/api/v1/zcash/transaction/z_sendmany', {
      fromAddress,
      recipients: [{ address: toAddress, amount }],
      privacyPolicy,
      minconf: 1
    });

    const operationId = response.data.operationId;

    // Poll for completion
    return await this.waitForOperation(operationId);
  }

  // Send transaction client-side (advanced, for maximum privacy)
  async sendTransactionClientSide(fromAccount, toAddress, amount) {
    const txManager = new ZcashTransactionManager(this.webzjs, this.keyManager);

    // Build and sign transaction
    const { txHex, txId } = await txManager.buildTransaction(
      fromAccount,
      toAddress,
      amount
    );

    // Broadcast
    await txManager.broadcastTransaction(txHex);

    return txId;
  }

  async waitForOperation(operationId) {
    // Implementation from earlier in the document
    // ...
  }
}
```

**When to Use Each Approach:**

| Scenario | Recommended Method | Reason |
|----------|-------------------|---------|
| General wallet usage | API (z_sendmany) | Simpler, handles fees automatically |
| Maximum privacy | Client-side with WebZjs | Keys and transaction details never leave client |
| Complex multi-sig | Client-side with WebZjs | Full control over transaction structure |
| Mobile/browser extension | Hybrid (keys client, tx API) | Balance of security and ease of use |
| Hardware wallet integration | Client-side with WebZjs | Sign on hardware device |

---

## Security Considerations

### 1. Seed Phrase Protection

**Critical Security Rules:**

1. **Never transmit seed phrases over the network**
   - Store locally only
   - Never send to API or backend
   - Never log to console in production

2. **Encrypt at rest**
   - Use strong encryption (AES-256-GCM)
   - Derive key from user password with PBKDF2
   - Minimum 100,000 iterations

3. **User education**
   - Warn users to write down seed phrase
   - Emphasize that seed phrase = complete wallet access
   - No recovery if lost

4. **Backup mechanisms**
   - Encourage paper backup
   - Consider encrypted cloud backup (optional)
   - Test recovery process

### 2. API Key Security

**Best Practices:**

1. **Never hardcode API keys in extension**
   - Use environment variables during development
   - Proxy through backend in production
   - Rotate keys regularly

2. **Backend proxy architecture**
   ```
   Browser Extension → Your Backend → Zcash API
   ```
   - Extension calls your backend
   - Backend adds API key and forwards to Zcash API
   - Limits exposure of API credentials

3. **Rate limiting**
   - Implement on backend to prevent abuse
   - Track requests per user/session
   - Block suspicious activity

### 3. Transaction Validation

**Pre-flight Checks:**

1. **Address validation**
   - Always validate addresses before sending
   - Use `/address/validate` endpoint
   - Warn users about address type mismatches

2. **Balance verification**
   - Check sufficient balance before initiating transaction
   - Account for transaction fees
   - Show estimated fee to user

3. **Amount validation**
   - Prevent dust amounts
   - Validate decimal precision
   - Confirm large transactions

4. **User confirmation**
   - Display all transaction details
   - Require explicit user confirmation
   - Show final amounts after fees

### 4. Browser Extension Security

**Extension Manifest (V3):**

```json
{
  "manifest_version": 3,
  "name": "Zcash Wallet Extension",
  "version": "1.0.0",
  "permissions": [
    "storage",
    "activeTab"
  ],
  "host_permissions": [
    "http://localhost:3000/*",
    "https://your-api-domain.com/*"
  ],
  "background": {
    "service_worker": "background.js"
  },
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'"
  }
}
```

**Security Headers:**
- Use HTTPS in production
- Implement Content Security Policy (CSP)
- Sanitize all user inputs
- Validate all API responses

### 5. Privacy Considerations

**Transaction Privacy:**

1. **Use shielded addresses by default**
   - Recommend unified addresses (u-addr)
   - Educate users about transparent vs. shielded

2. **Privacy policy selection**
   - Default to `FullPrivacy` when possible
   - Warn when using transparent transactions
   - Explain privacy implications

3. **Metadata protection**
   - Don't leak transaction details in logs
   - Be careful with error messages
   - Consider using Tor/VPN for additional privacy

---

## Implementation Checklist

### Phase 1: Basic Wallet Setup

- [ ] **Seed Phrase Management**
  - [ ] Generate BIP39 seed phrases (12 or 24 words)
  - [ ] Validate seed phrase input
  - [ ] Display seed phrase to user securely
  - [ ] Implement encrypted local storage
  - [ ] Create password-based encryption system

- [ ] **Wallet Initialization**
  - [ ] First-time setup flow
  - [ ] Seed phrase backup confirmation
  - [ ] Password creation with strength requirements
  - [ ] Wallet restoration from seed phrase

- [ ] **Key Derivation**
  - [ ] Implement BIP44 for transparent addresses
  - [ ] Derive transparent keys from seed
  - [ ] Generate and display transparent addresses
  - [ ] Store derivation indices

### Phase 2: Account & Balance Management

- [ ] **Account Management**
  - [ ] List all accounts from API
  - [ ] Create new shielded accounts
  - [ ] Get unified addresses for accounts
  - [ ] Display account information in UI

- [ ] **Balance Display**
  - [ ] Fetch balance for each account
  - [ ] Parse and convert zatoshis to ZEC
  - [ ] Display balances by pool (transparent, sapling, orchard)
  - [ ] Show total balance
  - [ ] Implement balance refresh functionality

- [ ] **Address Management**
  - [ ] Generate new receive addresses
  - [ ] Display QR codes for addresses
  - [ ] Copy address to clipboard
  - [ ] Validate addresses before use

### Phase 3: Transaction Functionality

- [ ] **Send Transactions**
  - [ ] Build transaction form (recipient, amount, memo)
  - [ ] Validate recipient address
  - [ ] Check sufficient balance
  - [ ] Select appropriate privacy policy
  - [ ] Call `z_sendmany` endpoint
  - [ ] Handle operation ID response

- [ ] **Transaction Monitoring**
  - [ ] Poll operation status
  - [ ] Display transaction status to user
  - [ ] Handle success/failure states
  - [ ] Extract and display transaction ID
  - [ ] Implement timeout handling

- [ ] **Transaction Types**
  - [ ] Transparent → Transparent
  - [ ] Transparent → Shielded (shielding)
  - [ ] Shielded → Transparent (deshielding)
  - [ ] Shielded → Shielded (private)
  - [ ] Multi-recipient transactions

- [ ] **Transaction History**
  - [ ] Fetch transaction list
  - [ ] Display recent transactions
  - [ ] Show transaction details
  - [ ] Filter by account/address

### Phase 4: Security Implementation

- [ ] **Encryption**
  - [ ] Implement PBKDF2 key derivation
  - [ ] Use AES-GCM for seed phrase encryption
  - [ ] Generate and store salt securely
  - [ ] Test encryption/decryption flow

- [ ] **Private Key Management**
  - [ ] Import transparent private keys
  - [ ] Export transparent private keys (with warnings)
  - [ ] Never expose keys in logs
  - [ ] Clear sensitive data from memory

- [ ] **User Security**
  - [ ] Implement session timeout/auto-lock
  - [ ] Require password for sensitive operations
  - [ ] Display security warnings appropriately
  - [ ] Educate users about seed phrase importance

### Phase 5: UI/UX

- [ ] **Wallet Interface**
  - [ ] Dashboard with balance overview
  - [ ] Account selection dropdown
  - [ ] Send transaction form
  - [ ] Receive address display
  - [ ] Transaction history list

- [ ] **User Feedback**
  - [ ] Loading states for async operations
  - [ ] Success/error notifications
  - [ ] Transaction progress indicators
  - [ ] Clear error messages

- [ ] **Onboarding**
  - [ ] Welcome screen
  - [ ] Seed phrase backup flow
  - [ ] Recovery verification
  - [ ] Tutorial/help section

### Phase 6: Testing & Deployment

- [ ] **Testing**
  - [ ] Test on testnet thoroughly
  - [ ] Verify all transaction types
  - [ ] Test wallet recovery
  - [ ] Security audit of encryption
  - [ ] Test error handling

- [ ] **Production Preparation**
  - [ ] Set up backend API proxy
  - [ ] Configure production API endpoints
  - [ ] Implement rate limiting
  - [ ] Set up error logging/monitoring
  - [ ] Create user documentation

- [ ] **Deployment**
  - [ ] Package extension for distribution
  - [ ] Submit to browser extension stores
  - [ ] Set up user support channels
  - [ ] Monitor for issues post-launch

---

## Additional Resources

### WebZjs Library

- **GitHub Repository:** https://github.com/ChainSafe/WebZjs
- **NPM Package:** `@chainsafe/webzjs`
- **Description:** WebAssembly-based Zcash library for browser environments
- **Key Features:**
  - ZIP32 hierarchical deterministic key derivation
  - Transparent, Sapling, and Orchard address generation
  - Unified address support
  - Transaction building and signing
  - Full browser compatibility via WebAssembly

**Installation:**
```bash
npm install @chainsafe/webzjs bip39
```

**Quick Start:**
```javascript
import { WebZjs } from '@chainsafe/webzjs';
import * as bip39 from 'bip39';

// Initialize WebZjs
const webzjs = await WebZjs.create();

// Generate seed
const mnemonic = bip39.generateMnemonic(256);
const seed = bip39.mnemonicToSeedSync(mnemonic);

// Derive unified address
const unifiedAddress = await webzjs.deriveUnifiedAddress(seed, 0, 'testnet');
console.log('Unified Address:', unifiedAddress);
```

### API Endpoints Reference

See [ROUTES.md](./ROUTES.md) for complete API documentation.

### Frontend Integration Examples

See [FRONTEND_INTEGRATION_GUIDE.md](./FRONTEND_INTEGRATION_GUIDE.md) for detailed code examples.

### Zcash Documentation

- **Official Docs:** https://zcash.readthedocs.io/
- **ZIP32 Spec (HD Key Derivation):** https://zips.z.cash/zip-0032
- **ZIP316 Spec (Unified Addresses):** https://zips.z.cash/zip-0316
- **BIP39 Spec (Mnemonic Seeds):** https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki
- **BIP44 Spec (HD Wallets):** https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki
- **Zcash Protocol Spec:** https://zips.z.cash/protocol/protocol.pdf

### Security Best Practices

- **OWASP Browser Extension Security:** https://cheatsheetseries.owasp.org/cheatsheets/Browser_Extension_Security_Cheat_Sheet.html
- **Web Crypto API:** https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API
- **Zcash Security Recommendations:** https://z.cash/support/security/

---

## Support & Questions

For API-related questions or issues, please refer to the main repository documentation or submit an issue on GitHub.

**Remember:** Never share your seed phrase or private keys with anyone. The development team will never ask for this information.
