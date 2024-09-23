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

async function testChangeAdmin() {
  const newAdminAddress = Address.parse(
    '0QB0EAt3rwr8mFphwnVEgCY3lGAHXiID2nrqxe9DKpd5Xpmt'
  );

  const payload = beginCell()
    .storeUint(op.changeAdmin, 32)
    .storeAddress(newAdminAddress)
    .endCell();

  const encodedPayload = payload.toBoc().toString('base64');

  const changeAdminLink = `https://tonhub.com/transfer/${contractAddress.toString(
    {
      testOnly: process.env.TESTNET === 'true',
    }
  )}?${qs.stringify({
    text: 'Change Admin',
    amount: '10000000', // 0.01 TON for gas fees
    bin: encodedPayload,
  })}`;

  console.log('Scan this QR code to change admin:');
  qrcode.generate(changeAdminLink, { small: true }, (code) => {
    console.log(code);
  });

  console.log('URL:', changeAdminLink);
  console.log(
    'After scanning, check the contract state to confirm the admin change.'
  );
}

testChangeAdmin();
