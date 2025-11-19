import dotenv from 'dotenv';

dotenv.config();

interface Config {
  port: number;
  nodeEnv: string;
  zcash: {
    rpcUrl: string;
    apiKey: string;
  };
  apiKey: string;
}

const config: Config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  zcash: {
    rpcUrl: process.env.ZCASH_RPC_URL || 'https://zcash-mainnet.gateway.tatum.io/',
    apiKey: process.env.ZCASH_API_KEY || '',
  },
  apiKey: process.env.API_KEY || '',
};

export default config;
