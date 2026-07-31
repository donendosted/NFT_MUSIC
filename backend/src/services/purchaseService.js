import {
  Address,
  BASE_FEE,
  Networks,
  Operation,
  StrKey,
  TransactionBuilder,
  nativeToScVal,
  xdr,
} from '@stellar/stellar-sdk';
import { Server as RpcServer } from '@stellar/stellar-sdk/rpc';

const PURCHASE_CONTRACT_ID = process.env.MUSIC_PURCHASE_CONTRACT_ID;
const RPC_URL = process.env.STELLAR_RPC_URL || 'https://soroban-testnet.stellar.org';
const STELLAR_NETWORK = (process.env.STELLAR_NETWORK || 'testnet').toLowerCase();
const NETWORK_PASSPHRASE = process.env.STELLAR_NETWORK_PASSPHRASE ||
  (STELLAR_NETWORK === 'public' ? Networks.PUBLIC : Networks.TESTNET);
const server = new RpcServer(RPC_URL);

function requirePurchaseContract() {
  if (!PURCHASE_CONTRACT_ID) throw new Error('MUSIC_PURCHASE_CONTRACT_ID is not configured');
  if (!StrKey.isValidContract(PURCHASE_CONTRACT_ID)) throw new Error('MUSIC_PURCHASE_CONTRACT_ID is invalid');
}

export async function buildPurchaseTransaction({ buyer, listingId, offeredPrice }) {
  requirePurchaseContract();
  if (!buyer || !listingId || offeredPrice === undefined) throw new Error('Missing buyer, listingId, or offeredPrice');
  if (!/^\d+$/.test(String(offeredPrice)) || BigInt(offeredPrice) <= 0n) {
    throw new Error('offeredPrice must be a positive stroop amount');
  }

  const account = await server.getAccount(buyer);
  const invoke = Operation.invokeHostFunction({
    func: xdr.HostFunction.hostFunctionTypeInvokeContract(new xdr.InvokeContractArgs({
      contractAddress: xdr.ScAddress.scAddressTypeContract(StrKey.decodeContract(PURCHASE_CONTRACT_ID)),
      functionName: Buffer.from('buy_music', 'utf-8'),
      args: [
        nativeToScVal(BigInt(listingId), { type: 'u64' }),
        Address.fromString(buyer).toScVal(),
        nativeToScVal(BigInt(offeredPrice), { type: 'i128' }),
      ],
    })),
    auth: [],
  });

  const transaction = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: NETWORK_PASSPHRASE })
    .addOperation(invoke)
    .setTimeout(300)
    .build();
  const prepared = await server.prepareTransaction(transaction);
  return prepared.toEnvelope().toXDR('base64');
}

/** Submit a wallet-signed transaction and return only RPC-confirmed metadata. */
export async function submitPurchaseTransaction(signedTxXDR) {
  const sendResult = await server.sendTransaction({ toXDR: () => signedTxXDR });
  if (sendResult.status !== 'PENDING' && sendResult.status !== 'OK') {
    throw new Error(sendResult.error || 'Soroban RPC rejected purchase transaction');
  }

  const timeoutAt = Date.now() + 90_000;
  while (Date.now() < timeoutAt) {
    const result = await server.getTransaction(sendResult.hash);
    if (result.status === 'SUCCESS') {
      return { transactionHash: sendResult.hash, ledger: result.ledger, status: result.status, result };
    }
    if (result.status === 'FAILED') throw new Error('Purchase transaction failed on-chain');
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }
  throw new Error(`Timed out waiting for purchase transaction ${sendResult.hash}`);
}

export function purchaseExplorerUrl(transactionHash) {
  const network = STELLAR_NETWORK === 'public' ? 'public' : 'testnet';
  return `https://stellar.expert/explorer/${network}/tx/${transactionHash}`;
}

export { PURCHASE_CONTRACT_ID };
