import { Address, beginCell, toNano } from 'ton-core';
import qrcode from 'qrcode-terminal';
import qs from 'qs';
import dotenv from 'dotenv';
import { Builder, TonClient } from '@ton/ton';
dotenv.config();
async function testSwap() {
  const STONFI_ROUTER_ADDR = Address.parse(
    'EQB3ncyBUTjZUA5EnFKR5_EnOMI9V1tTEAAPaiU71gc4TiUt'
  );
  const STONFI_PROXY_ADDR = Address.parse(
    'EQARULUYsmJq1RiZ-YiH-IJLcAZUVkVff-KBPwEmmaQGH6aC'
  );

  const REDO_ADDR = Address.parse(
    'EQA_4uah8neMWm1HDhg-fSCJTQH3OzooYOfhuAosAarJP_nk'
  );
  const RECIPIENT_ADDR = Address.parse(
    'UQAftMOLnzvupKs6sDsZL3pLnPps8Aj40G53tZ8ZzztaPCP_'
  );

  const REFERRAL_ADDR = Address.parse(
    'UQD6wz9UpPYn8-O3XiYHMN95qlT9axaGvxgmBXcQ-rkWqeHB'
  );

  const OP_CODE_STONFI_SWAP = 630424929;
  const OP_CODE_JETTON_TRANSFER = 260734629;
  const TRADE_VALUE = toNano('1');
  const TRADE_FEE = toNano('0.2');
  const LIMIT = toNano('0');
  const deadline = Math.floor(Date.now() / 1000) + 300;
  //  const fwdpayload = beginCell()
  //    .storeUint(0x25938561, 32)
  //    .storeAddress(REDO_ADDR)
  //    .storeCoins(0) //limit
  //    .storeAddress(RECIPIENT_ADDR)
  //    .storeUint(0, 1)
  //    .endCell();

  const payload = beginCell()
    .storeUint(OP_CODE_JETTON_TRANSFER, 32)
    .storeUint(0, 64)
    .storeCoins(TRADE_VALUE - TRADE_FEE)
    .storeAddress(STONFI_ROUTER_ADDR)
    .storeAddress(null) //response destination
    .storeAddress(null) //custom payload
    .storeCoins(TRADE_FEE) //fee
    .storeRef(
      beginCell()
        .storeUint(OP_CODE_STONFI_SWAP, 32)
        .storeAddress(REDO_ADDR)
        .storeCoins(0) //limit
        .storeAddress(RECIPIENT_ADDR)
        .storeAddress(null)
        .storeUint(0, 1)
        .endCell()
    )
    .endCell();

  const boc = payload.toBoc();
  const encodedBoc = boc.toString('base64');

  const transactionLink = `ton://transfer/${STONFI_PROXY_ADDR.toString()}?${qs.stringify(
    {
      amount: (TRADE_VALUE + TRADE_FEE).toString(),
      bin: encodedBoc,
      mode: 1,
    }
  )}`;

  console.log('Scan this QR code to initiate withdrawal:');
  qrcode.generate(transactionLink, { small: true }, (code) => {
    console.log(code);
  });

  console.log('URL:', transactionLink);
}

testSwap();
