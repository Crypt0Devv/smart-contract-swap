import { Address, beginCell, toNano } from 'ton-core';
import qrcode from 'qrcode-terminal';
import qs from 'qs';
import dotenv from 'dotenv';
import { Builder, TonClient } from '@ton/ton';
dotenv.config();
async function testSwap() {
  const TON_VAULT_ADDR = Address.parse(
    'EQDa4VOnTYlLvDJ0gZjNYm5PXfSmmtL6Vs6A_CZEtXCNICq_'
  );
  const TON_TSWAP_POOL_ADDR = Address.parse(
    'EQCSIiae_6OWjSwdBqi30AhFteOmXqqYam-ipDbYq6LR498r'
  );
  const RECIPIENT_ADDR = Address.parse(
    'UQAftMOLnzvupKs6sDsZL3pLnPps8Aj40G53tZ8ZzztaPCP_'
  );

  const REFERRAL_ADDR = Address.parse(
    'UQD6wz9UpPYn8-O3XiYHMN95qlT9axaGvxgmBXcQ-rkWqeHB'
  );

  const ton_vault_swap = 0xea06185d;
  const TRADE_VALUE = toNano('1');
  const TRADE_FEE = toNano('0.15');
  const deadline = Math.floor(Date.now() / 1000) + 300;

  const payload = beginCell()
    .storeUint(ton_vault_swap, 32)
    .storeUint(0, 64) // query_id
    .storeCoins(TRADE_VALUE - TRADE_FEE)
    .storeAddress(TON_TSWAP_POOL_ADDR)
    .storeUint(0, 1) // kind
    .storeCoins(0) // limit
    .storeMaybeRef(null)
    .storeRef(
      beginCell()
        .storeUint(deadline, 32) // deadline: current time + 5 minutes
        .storeAddress(RECIPIENT_ADDR)
        .storeAddress(null)
        .storeMaybeRef(null)
        .storeMaybeRef(null)
        .endCell()
    )
    .endCell();

  const boc = payload.toBoc();
  const encodedBoc = boc.toString('base64');

  const transactionLink = `ton://transfer/${TON_VAULT_ADDR.toString()}?${qs.stringify(
    {
      amount: TRADE_VALUE.toString(),
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
