import { address, toNano } from 'ton-core';
import { MainContract } from '../wrappers/MainContract';
import { compile, NetworkProvider } from '@ton-community/blueprint';

export async function run(provider: NetworkProvider) {
  const myContract = MainContract.createFromConfig(
    {
      address: address('0QB0EAt3rwr8mFphwnVEgCY3lGAHXiID2nrqxe9DKpd5Xpmt'),
      owner_address: address(
        '0QB0EAt3rwr8mFphwnVEgCY3lGAHXiID2nrqxe9DKpd5Xpmt'
      ),
    },
    await compile('MainContract')
  );

  const openedContract = provider.open(myContract);

  openedContract.sendDeploy(provider.sender(), toNano('0.05'));
  console.log('myContract.address)', myContract.address);

  await provider.waitForDeploy(myContract.address);
}
