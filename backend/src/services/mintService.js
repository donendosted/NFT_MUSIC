import {
  Account,
  TransactionBuilder,
  Operation,
  Networks,
  BASE_FEE,
} from '@stellar/stellar-sdk';

const NFT_CONTRACT_ID = process.env.NFT_CONTRACT_ID;
const RPC_URL = process.env.STELLAR_RPC_URL || 'https://soroban-testnet.stellar.org';
const NETWORK_PASSPHRASE = Networks.TESTNET;

export async function buildMintTransaction(walletAddress, name, musicUrl, artist) {
  const account = new Account(walletAddress, '0');
  
  const mintOperation = Operation.invokeContract({
    contractAddress: NFT_CONTRACT_ID,
    method: 'mint',
    args: [
      { type: 'address', value: walletAddress },
      { type: 'string', value: name || 'Music NFT' },
      { type: 'string', value: musicUrl },
      { type: 'string', value: artist || 'Unknown' },
    ],
  });

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(mintOperation)
    .setTimeout(30)
    .build();

  return tx.toXDR();
}

export async function submitTransaction(signedXDR) {
  const res = await fetch(RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'sendTransaction',
      params: {
        transaction: signedXDR,
        networkPassphrase: NETWORK_PASSPHRASE,
      },
    }),
  });

  const data = await res.json();
  
  if (data.error) {
    throw new Error(data.error.message || 'Transaction failed');
  }

  return {
    txHash: data.result?.hash,
    explorerUrl: `https://stellar.expert/explorer/testnet/tx/${data.result?.hash}`,
  };
}