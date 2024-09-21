import { Address, Cell, beginCell, toNano } from 'ton-core';
import { getHttpV4Endpoint } from '@orbs-network/ton-access';
import { TonClient4 } from 'ton';
import qs from 'qs';
import qrcode from 'qrcode-terminal';
import dotenv from 'dotenv';
dotenv.config();
const contractAddress = Address.parse(
  'EQDS_VZ9nI-R00p2tjqulwNxaJafaQAm-YG44Qn4yP3sTugl'
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
  const DEPOSIT_OP = 0x47d54391;
  const payload = beginCell().storeUint(DEPOSIT_OP, 32).endCell();
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

async function testWithdraw() {
  const withdrawAmount = toNano(0.05); // 0.05 TON
  const WITHDRAW_OP = 0x41836980; // Replace with your actual withdraw op code

  const payload = beginCell()
    .storeUint(WITHDRAW_OP, 32)
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
// testWithdraw();

// testDeposit();
