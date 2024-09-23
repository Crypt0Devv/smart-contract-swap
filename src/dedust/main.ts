import {
  Address,
  toNano,
  Sender,
  TonClient4,
  WalletContractV4,
  WalletContractV3R2,
} from '@ton/ton';
import {
  Asset,
  Factory,
  JettonRoot,
  MAINNET_FACTORY_ADDR,
  Pool,
  PoolType,
  VaultNative,
} from '@dedust/sdk';
import { mnemonicToPrivateKey } from '@ton/crypto';
import dotenv from 'dotenv';
import axios from 'axios';
dotenv.config();

const TSWAP_ADDR = Address.parse(
  'EQAGYK08DaJaQpmZESz3y9gqi7rmpoBiyKQru-firOwqPzR4'
);
async function createSender() {
  // Connect to the TON blockchain
  const tonClient = new TonClient4({
    endpoint: 'https://mainnet-v4.tonhubapi.com',
  });

  const mnemonic = process.env.DEV_WALLET_MNEMONIC;
  console.log('mnemonic', mnemonic);
  console.log("mnemonic?.split(' ')", mnemonic?.split(' '));

  const keys = await mnemonicToPrivateKey(mnemonic?.split(' ') ?? ['']);
  // Create a wallet contract
  const wallet = tonClient.open(
    WalletContractV3R2.create({
      workchain: 0,
      publicKey: keys.publicKey,
    })
  );

  // Open the wallet contract
  const sender = wallet.sender(keys.secretKey);

  return sender;
}

function createAxiosInstance(): any {
  return axios.create({
    timeout: 30000000, // 30 seconds
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

async function main() {
  const axiosInstance = createAxiosInstance();
  const tonClient = new TonClient4({
    endpoint: 'https://mainnet-v4.tonhubapi.com',
    timeout: 100000000,
    httpAdapter: createAxiosInstance().config,
  });

  /**
   * STEP 1. Find all necessary contracts.
   */

  const sender: Sender = await createSender();
  const factory = tonClient.open(
    Factory.createFromAddress(MAINNET_FACTORY_ADDR)
  );

  const tswap = tonClient.open(JettonRoot.createFromAddress(TSWAP_ADDR));
  console.log('tswap', tswap);

  const pool = tonClient.open(
    Pool.createFromAddress(
      await factory.getPoolAddress({
        poolType: PoolType.VOLATILE,
        assets: [Asset.native(), Asset.jetton(tswap.address)],
      })
    )
  );

  const nativeVault = tonClient.open(
    VaultNative.createFromAddress(await factory.getVaultAddress(Asset.native()))
  );

  const lastBlock = await tonClient.getLastBlock();
  const poolState = await tonClient.getAccountLite(
    lastBlock.last.seqno,
    pool.address
  );

  if (poolState.account.state.type !== 'active') {
    throw new Error('Pool is not exist.');
  }

  const vaultState = await tonClient.getAccountLite(
    lastBlock.last.seqno,
    nativeVault.address
  );

  if (vaultState.account.state.type !== 'active') {
    throw new Error('Native Vault is not exist.');
  }

  const amountIn = toNano('1'); // 1 TON

  //   const res = await pool.getEstimatedSwapOut({
  const { amountOut: expectedAmountOut } = await pool.getEstimatedSwapOut({
    assetIn: Asset.native(),
    amountIn,
  });

  // Slippage handling (1%)
  const minAmountOut = (expectedAmountOut * 99n) / 100n; // expectedAmountOut - 1%
  console.log('minAmountOut', minAmountOut);
  console.log('pool.address', pool.address);

  const res = await nativeVault.sendSwap(sender, {
    poolAddress: pool.address,
    amount: amountIn,
    // limit: minAmountOut,
    gasAmount: toNano('0.25'),
  });
  console.log('res', res);
}

main().catch(console.dir);
