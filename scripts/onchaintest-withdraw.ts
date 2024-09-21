import { Address, Cell, beginCell, toNano } from 'ton-core';
import qs from 'qs';
import qrcode from 'qrcode-terminal';
import dotenv from 'dotenv';
import { op } from '../utils/constants';
dotenv.config();
const contractAddress = Address.parse(
  'EQBv-Ka-2oXJWatRVp5oCNzdegOXuABjToVnsgQ_LUbMMsFF'
);
async function testWithdraw() {
  const withdrawAmount = toNano(0.05); // 0.05 TON

  const payload = beginCell()
    .storeUint(op.withdraw, 32)
    .storeCoins(withdrawAmount)
    .endCell();

  const encodedPayload = payload.toBoc().toString('base64');

  const withdrawLink = `https://tonhub.com/transfer/${contractAddress.toString({
    testOnly: process.env.TESTNET === 'true',
  })}?${qs.stringify({
    text: 'Withdraw test',
    amount: '10000000', // 0.01 TON for gas fees
    bin: encodedPayload,
  })}`;

  console.log('Scan this QR code to initiate withdrawal:');
  qrcode.generate(withdrawLink, { small: true }, (code) => {
    console.log(code);
  });

  console.log('URL:', withdrawLink);
  console.log(
    'After scanning, check the contract state to confirm the withdrawal.'
  );
}

testWithdraw();
