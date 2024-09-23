import {
  TonClient,
  WalletContractV4,
  beginCell,
  internal,
  toNano,
} from '@ton/ton';
import { mnemonicToPrivateKey } from '@ton/crypto';
import { DEX, pTON } from '@ston-fi/sdk';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  const client = new TonClient({
    endpoint: 'https://toncenter.com/api/v2/jsonRPC',
    apiKey: '7cb1d456aefc2afcfa6cc7f19c6dfe025b93e0b6946e39afb9f89fd5f6451f23',
  });

  const mnemonic = process.env.DEV_WALLET_MNEMONIC;
  const mnemonics = mnemonic?.split(' ');
  console.log('mnemonics', mnemonics);
  const keyPair = await mnemonicToPrivateKey(mnemonics ?? ['']);

  const workchain = 0;
  const wallet = WalletContractV4.create({
    workchain,
    publicKey: keyPair.publicKey,
  });
  const walletContract = client.open(wallet);

  const router = client.open(new DEX.v1.Router());
  // swap 1 TON to STON but not less than 1 nano STON
  //   const txParams = await router.getSwapTonToJettonTxParams({
  //     userWalletAddress: 'UQAftMOLnzvupKs6sDsZL3pLnPps8Aj40G53tZ8ZzztaPCP_', // ! replace with your address
  //     proxyTon: new pTON.v1(),
  //     offerAmount: toNano('0.3'),
  //     askJettonAddress: 'EQA2kCVNwVsil2EM2mB0SkXytxCqQjS4mttjDpnXmwG9T6bO', // STON
  //     minAskAmount: '1',
  //     queryId: 12345,
  //   });
  const txArgs = {
    offerAmount: toNano('0.5'),
    askJettonAddress: 'EQA2kCVNwVsil2EM2mB0SkXytxCqQjS4mttjDpnXmwG9T6bO',
    minAskAmount: toNano('0.1'),
    proxyTon: new pTON.v1(),
    userWalletAddress: wallet.address.toString(),
  };

  // you can instantly send the transaction using the router method with send suffix
  await router.sendSwapTonToJetton(
    walletContract.sender(keyPair.secretKey),
    txArgs
  );

  //   // or you can get the transaction parameters
  //   const txParams = await dex.getSwapTonToJettonTxParams(txArgs);

  //   // and send it manually later
  //   await walletContract.sendTransfer({
  //     seqno: await walletContract.getSeqno(),
  //     secretKey: keyPair.secretKey,
  //     messages: [internal(txParams)],
  //   });
}
main();
