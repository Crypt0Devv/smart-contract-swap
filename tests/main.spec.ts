import { toNano } from 'ton-core';
import {
  Blockchain,
  SandboxContract,
  TreasuryContract,
} from '@ton-community/sandbox';
import { MainContract } from '../wrappers/MainContract';
import '@ton-community/test-utils';
import { compile } from '@ton-community/blueprint';

describe('main.fc contract tests', () => {
  let blockchain: Blockchain;
  let myContract: any;
  let initWallet: SandboxContract<TreasuryContract>;
  let ownerWallet: SandboxContract<TreasuryContract>;
  let codeCell: any;

  beforeAll(async () => {
    codeCell = await compile('MainContract');
  });

  beforeEach(async () => {
    blockchain = await Blockchain.create();
    initWallet = await blockchain.treasury('initWallet');
    ownerWallet = await blockchain.treasury('ownerWallet');

    if (codeCell) {
      myContract = blockchain.openContract(
        (await MainContract.createFromConfig(
          {
            address: initWallet.address,
            owner_address: ownerWallet.address,
          },
          codeCell
        )) as any
      );
    }
  });

  it('should get the proper most recent sender address', async () => {
    const senderWallet = await blockchain.treasury('sender');
    const sentMessageResult = await myContract.sendDeposit(
      senderWallet.getSender(),
      toNano('1')
    );

    expect(sentMessageResult.transactions).toHaveTransaction({
      from: senderWallet.address,
      to: myContract.address,
      success: true,
    });

    const data = await myContract.getData();

    expect(data.recent_sender.toString()).toBe(senderWallet.address.toString());
  });

  it('successfully deposits funds', async () => {
    const senderWallet = await blockchain.treasury('sender');

    const depositMessageResult = await myContract.sendDeposit(
      senderWallet.getSender(),
      toNano('5')
    );

    expect(depositMessageResult.transactions).toHaveTransaction({
      from: senderWallet.address,
      to: myContract.address,
      success: true,
    });

    const balanceRequest = await myContract.getBalance();

    expect(balanceRequest.number).toBeGreaterThan(toNano('4.99'));
  });

  it('should return deposit funds as no command is sent', async () => {
    const senderWallet = await blockchain.treasury('sender');

    const depositMessageResult = await myContract.sendNoCodeDeposit(
      senderWallet.getSender(),
      toNano('5')
    );

    expect(depositMessageResult.transactions).toHaveTransaction({
      from: myContract.address,
      to: senderWallet.address,
      success: true,
    });

    const balanceRequest = await myContract.getBalance();

    expect(balanceRequest.number).toBe(0);
  });

  it('successfully withdraws funds on behalf of owner', async () => {
    const senderWallet = await blockchain.treasury('sender');
    await myContract.sendDeposit(senderWallet.getSender(), toNano('5'));

    const withdrawalRequestResult = await myContract.sendWithdrawalRequest(
      ownerWallet.getSender(),
      toNano('0.05'),
      toNano('1')
    );

    expect(withdrawalRequestResult.transactions).toHaveTransaction({
      from: myContract.address,
      to: ownerWallet.address,
      success: true,
      value: toNano(1),
    });
  });

  it('fails to withdraw funds on behalf of not-owner', async () => {
    const senderWallet = await blockchain.treasury('sender');

    await myContract.sendDeposit(senderWallet.getSender(), toNano('5'));

    const withdrawalRequestResult = await myContract.sendWithdrawalRequest(
      senderWallet.getSender(),
      toNano('0.5'),
      toNano('1')
    );

    expect(withdrawalRequestResult.transactions).toHaveTransaction({
      from: senderWallet.address,
      to: myContract.address,
      success: false,
      exitCode: 403,
    });
  });

  it('fails to withdraw funds because lack of balance', async () => {
    const withdrawalRequestResult = await myContract.sendWithdrawalRequest(
      ownerWallet.getSender(),
      toNano('0.5'),
      toNano('1')
    );

    expect(withdrawalRequestResult.transactions).toHaveTransaction({
      from: ownerWallet.address,
      to: myContract.address,
      success: false,
      exitCode: 104,
    });
  });

  it('succeeds to change admin address when requested by owner ', async () => {
    const newAdmin = await blockchain.treasury('sender');

    const withdrawalRequestResult = await myContract.sendChangeAdminRequest(
      ownerWallet.getSender(),
      toNano('0.5'),
      newAdmin.address
    );

    expect(withdrawalRequestResult.transactions).toHaveTransaction({
      from: ownerWallet.address,
      to: myContract.address,
      success: true,
    });

    const data = await myContract.getData();
    expect(data.owner_address.toString()).toBe(newAdmin.address.toString());
  });

  it('fails to change admin address when requested by not owner', async () => {
    const newAdmin = await blockchain.treasury('sender');
    const withdrawalRequestResult = await myContract.sendChangeAdminRequest(
      newAdmin.getSender(),
      toNano('0.5'),
      newAdmin.address
    );

    expect(withdrawalRequestResult.transactions).toHaveTransaction({
      from: newAdmin.address,
      to: myContract.address,
      success: false,
    });

    const data = await myContract.getData();
    expect(data.owner_address.toString()).toBe(ownerWallet.address.toString());
  });
});
