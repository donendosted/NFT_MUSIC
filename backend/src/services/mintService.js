import {
  StrKey,
  TransactionBuilder,
  Networks,
  Operation,
  BASE_FEE,
  Address,
  xdr,
  nativeToScVal,
  scValToNative,
} from '@stellar/stellar-sdk';

import { Server as rpc } from '@stellar/stellar-sdk/rpc';

const NFT_CONTRACT_ID = process.env.NFT_CONTRACT_ID || process.env.NFT_COLLECTION_ID;
const RPC_URL = process.env.STELLAR_RPC_URL || 'https://soroban-testnet.stellar.org';
const STELLAR_NETWORK = (process.env.STELLAR_NETWORK || 'testnet').toLowerCase();
const NETWORK_PASSPHRASE =
  process.env.STELLAR_NETWORK_PASSPHRASE ||
  (STELLAR_NETWORK === 'public' ? Networks.PUBLIC : Networks.TESTNET);
const sorobanServer = new rpc(RPC_URL);

export async function buildMintTransaction(walletAddress, name, musicUri, artist) {
  if (!NFT_CONTRACT_ID) {
    throw new Error('NFT_CONTRACT_ID is not configured');
  }

  if (!StrKey.isValidContract(NFT_CONTRACT_ID)) {
    throw new Error('NFT_CONTRACT_ID is invalid');
  }

  const contractIdBuffer = StrKey.decodeContract(NFT_CONTRACT_ID);

  const account = await sorobanServer.getAccount(walletAddress);

  const invokeContractOp = Operation.invokeHostFunction({
    func: xdr.HostFunction.hostFunctionTypeInvokeContract(
      new xdr.InvokeContractArgs({
        contractAddress: xdr.ScAddress.scAddressTypeContract(
          contractIdBuffer
        ),
        functionName: Buffer.from('mint', 'utf-8'),
        args: [
          Address.fromString(walletAddress).toScVal(),
          nativeToScVal(name || 'Music NFT'),
          nativeToScVal(musicUri),
          nativeToScVal(artist || 'Unknown'),
        ],
      })
    ),
    auth: [],
  });

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(invokeContractOp)
    .setTimeout(300)
    .build();

  const preparedTx = await sorobanServer.prepareTransaction(tx);

  return preparedTx.toEnvelope().toXDR('base64');
}

export async function submitTransaction(signedXDR) {
  const transactionWrapper = {
    toXDR: () => signedXDR,
  };

  const sendResult = await sorobanServer.sendTransaction(transactionWrapper);

  if (sendResult.status !== 'PENDING' && sendResult.status !== 'OK') {
    throw new Error(sendResult.error || 'Failed to send transaction');
  }

  let result;
  while (true) {
    result = await sorobanServer.getTransaction(sendResult.hash);

    if (result.status === 'SUCCESS') {
      break;
    }

    if (result.status === 'FAILED') {
      throw new Error('Transaction failed');
    }

    await new Promise((r) => setTimeout(r, 1000));
  }

  return {
    txHash: sendResult.hash,
    returnValue: result.returnValue ? scValToNative(result.returnValue) : null,
    explorerUrl: `https://stellar.expert/explorer/testnet/tx/${sendResult.hash}`,
  };
}
