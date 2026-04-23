import {
  SorobanRpc,
  Contract,
  Address,
  TransactionBuilder,
  Networks,
  BASE_FEE,
  nativeToScVal,
} from '@stellar/stellar-sdk';

const NFT_CONTRACT_ID = process.env.NFT_CONTRACT_ID;
const RPC_URL = process.env.STELLAR_RPC_URL || 'https://soroban-testnet.stellar.org';
const NETWORK_PASSPHRASE = Networks.TESTNET;

export async function buildMintTransaction(walletAddress, name, musicUrl, artist) {
  const rpc = new SorobanRpc.Server(RPC_URL, NETWORK_PASSPHRASE);
  const account = await rpc.getAccount(walletAddress);
  const contract = new Contract(NFT_CONTRACT_ID);

  const op = contract.call(
    'mint',
    new Address(walletAddress).toScVal(),
    nativeToScVal(name || 'Music NFT'),
    nativeToScVal(musicUrl),
    nativeToScVal(artist || 'Unknown')
  );

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(op)
    .setTimeout(30)
    .build();

  return tx.toXDR();
}

export async function submitTransaction(signedXDR) {
  const rpc = new SorobanRpc.Server(RPC_URL, NETWORK_PASSPHRASE);

  const sendResponse = await rpc.sendTransaction(signedXDR);

  if (sendResponse.error) {
    throw new Error(sendResponse.error.message || 'Transaction failed');
  }

  if (sendResponse.status === 'ERROR') {
    throw new Error(sendResponse.errorResult?.message || 'Transaction failed');
  }

  return {
    txHash: sendResponse.hash,
    explorerUrl: `https://stellar.expert/explorer/testnet/tx/${sendResponse.hash}`,
  };
}