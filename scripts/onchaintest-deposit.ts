import { Address, Cell, beginCell, toNano } from 'ton-core';
import { getHttpV4Endpoint } from '@orbs-network/ton-access';
import { TonClient4 } from 'ton';
import qs from 'qs';
import qrcode from 'qrcode-terminal';
import dotenv from 'dotenv';
import { op } from '../utils/constants';
dotenv.config();
const contractAddress = Address.parse(
  'EQBv-Ka-2oXJWatRVp5oCNzdegOXuABjToVnsgQ_LUbMMsFF'
);
export async function testDeposit() {
  const endpoint = await getHttpV4Endpoint({
    network: 'testnet',
  });

  const client4 = new TonClient4({ endpoint });

  const latestBlock = await client4.getLastBlock();
  let status = await client4.getAccount(
    latestBlock.last.seqno,
    contractAddress
  );

  if (status.account.state.type !== 'active') {
    console.log('Contract is not active');
    return;
  }

  console.log('Testing deposit functionality...');
  const depositAmount = toNano(0.1);
  const payload = beginCell().storeUint(op.deposit, 32).endCell();
  const encodedPayload = payload.toBoc().toString('base64');
  const depositLink = `https://tonhub.com/transfer/${contractAddress.toString({
    testOnly: process.env.TESTNET ? true : false,
  })}?${qs.stringify({
    text: 'Deposit test',
    amount: depositAmount.toString(10),
    bin: encodedPayload,
  })}`;
  console.log('depositLink', depositLink);

  console.log('Scan this QR code to make a deposit:');
  qrcode.generate(depositLink, { small: true }, (code) => {
    console.log(code);
  });
}

testDeposit();
