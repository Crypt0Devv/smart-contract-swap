import TonWeb from 'tonweb';
import * as TonWebMnemonic from 'tonweb-mnemonic';
import { TonClient, TonClient4, toNano } from '@ton/ton';
import { DEX, pTON } from '@ston-fi/sdk';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  const tonWeb = new TonWeb();
  const client = new TonWeb.HttpProvider();
  const tonClient4 = new TonClient4({
    endpoint: 'https://mainnet-v4.tonhubapi.com',
  });
  const lastBlock = await tonClient4.getLastBlock();

  const tonClient = new TonClient({
    endpoint: 'https://toncenter.com/api/v2/jsonRPC',
  });
  const mnemonic = process.env.DEV_WALLET_MNEMONIC;
  const mnemonics = mnemonic?.split(' ');

  const keyPair = await TonWebMnemonic.mnemonicToKeyPair(mnemonics ?? ['']);

  const wallet = new tonWeb.wallet.all.v4R2(client, {
    publicKey: keyPair.publicKey,
  });

  const dex = tonClient.open(new DEX.v1.Router());

  const txParams = await dex.getSwapTonToJettonTxParams({
    offerAmount: toNano('1'), // swap 1 TON
    askJettonAddress: 'EQA2kCVNwVsil2EM2mB0SkXytxCqQjS4mttjDpnXmwG9T6bO', // for a STON
    minAskAmount: toNano('0.1'), // but not less than 0.1 STON
    proxyTon: new pTON.v1(),
    userWalletAddress: (await wallet.getAddress()).toString(),
  });
  console.log('lastBlock', lastBlock);

  const res = await wallet.methods
    .transfer({
      secretKey: keyPair.secretKey,
      toAddress: txParams.to.toString(),
      amount: new tonWeb.utils.BN(txParams.value.toString()),
      seqno: lastBlock.last.seqno,
      payload: TonWeb.boc.Cell.oneFromBoc(
        TonWeb.utils.base64ToBytes(
          txParams.body?.toBoc().toString('base64') ?? ''
        )
      ),
      sendMode: 3,
    })
    .send();
}

main();
function axios(arg0: {
  method: string;
  url: string;
  params: { address: any };
  headers: { 'X-API-Key': any; 'Content-Type': string };
  timeout: number;
}) {
  throw new Error('Function not implemented.');
}
