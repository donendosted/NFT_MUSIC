import { Address, BASE_FEE, Networks, Operation, StrKey, TransactionBuilder, nativeToScVal, xdr } from '@stellar/stellar-sdk';
import { Server as RpcServer } from '@stellar/stellar-sdk/rpc';

const MARKETPLACE_CONTRACT_ID = process.env.MARKETPLACE_CONTRACT_ID;
const RPC_URL = process.env.STELLAR_RPC_URL || 'https://soroban-testnet.stellar.org';
const NETWORK_PASSPHRASE = process.env.STELLAR_NETWORK_PASSPHRASE || Networks.TESTNET;
const server = new RpcServer(RPC_URL);

export async function buildListingTransaction({ seller, tokenId, price }) {
  if (!MARKETPLACE_CONTRACT_ID || !StrKey.isValidContract(MARKETPLACE_CONTRACT_ID)) {
    throw new Error('MARKETPLACE_CONTRACT_ID is not configured');
  }
  if (!/^\d+$/.test(String(price)) || BigInt(price) <= 0n) throw new Error('price must be a positive stroop amount');
  const account = await server.getAccount(seller);
  const invoke = Operation.invokeHostFunction({
    func: xdr.HostFunction.hostFunctionTypeInvokeContract(new xdr.InvokeContractArgs({
      contractAddress: xdr.ScAddress.scAddressTypeContract(StrKey.decodeContract(MARKETPLACE_CONTRACT_ID)),
      functionName: Buffer.from('list_music', 'utf-8'),
      args: [Address.fromString(seller).toScVal(), nativeToScVal(tokenId, { type: 'u32' }), nativeToScVal(BigInt(price), { type: 'i128' })],
    })), auth: [],
  });
  const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: NETWORK_PASSPHRASE }).addOperation(invoke).setTimeout(300).build();
  const prepared = await server.prepareTransaction(tx);
  return prepared.toEnvelope().toXDR('base64');
}

export { MARKETPLACE_CONTRACT_ID };
