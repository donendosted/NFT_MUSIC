import { Buffer } from "buffer";
import { Address } from "@stellar/stellar-sdk";
import {
  AssembledTransaction,
  Client as ContractClient,
  ClientOptions as ContractClientOptions,
  MethodOptions,
  Result,
  Spec as ContractSpec,
} from "@stellar/stellar-sdk/contract";
import type {
  u32,
  i32,
  u64,
  i64,
  u128,
  i128,
  u256,
  i256,
  Option,
  Timepoint,
  Duration,
} from "@stellar/stellar-sdk/contract";
export * from "@stellar/stellar-sdk";
export * as contract from "@stellar/stellar-sdk/contract";
export * as rpc from "@stellar/stellar-sdk/rpc";

if (typeof window !== "undefined") {
  //@ts-ignore Buffer exists
  window.Buffer = window.Buffer || Buffer;
}





export interface Config {
  admin: string;
  /**
 * Soroban token contract used for settlement (for example the Stellar asset contract).
 */
asset: string;
  marketplace_contract: string;
  nft_contract: string;
}


/**
 * ABI shared with the marketplace contract. The marketplace must persist its
 * listings in a compatible shape and only complete an active listing once.
 */
export interface Listing {
  active: boolean;
  asset: string;
  listing_id: u64;
  nft_contract: string;
  price: i128;
  seller: string;
  token_id: u32;
}


export interface Purchase {
  asset: string;
  buyer: string;
  ledger_sequence: u32;
  listing_id: u64;
  marketplace_contract: string;
  nft_contract: string;
  purchase_id: u64;
  purchase_price: i128;
  purchase_status: u32;
  purchase_timestamp: u64;
  seller: string;
  token_id: u32;
  /**
 * Soroban contracts do not have the enclosing transaction hash. The API
 * persists the RPC-confirmed hash in its purchase record after settlement.
 */
transaction_hash: string;
}

export type DataKey = {tag: "Config", values: void} | {tag: "PurchaseCount", values: void} | {tag: "Purchase", values: readonly [u64]} | {tag: "ListingPurchase", values: readonly [u64]} | {tag: "BuyerHistory", values: readonly [string]} | {tag: "SellerHistory", values: readonly [string]};

export const PurchaseError = {
  1: {message:"AlreadyInitialized"},
  2: {message:"NotInitialized"},
  3: {message:"ListingNotFound"},
  4: {message:"ListingInactive"},
  5: {message:"BuyerIsSeller"},
  6: {message:"OfferedPriceMismatch"},
  7: {message:"InvalidListing"},
  8: {message:"InvalidPrice"},
  9: {message:"NftOwnerMismatch"},
  10: {message:"AlreadyPurchased"},
  11: {message:"OwnershipTransferFailed"}
}

export interface Client {
  /**
   * Construct and simulate a initialize transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  initialize: ({admin, nft_contract, marketplace_contract, asset}: {admin: string, nft_contract: string, marketplace_contract: string, asset: string}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a buy_music transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Settles payment and NFT delivery atomically. The buyer authorizes this
   * invocation; the marketplace enforces the seller's listing/escrow rules.
   */
  buy_music: ({listing_id, buyer, offered_price}: {listing_id: u64, buyer: string, offered_price: i128}, options?: MethodOptions) => Promise<AssembledTransaction<Result<Purchase>>>

  /**
   * Construct and simulate a get_purchase transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_purchase: ({purchase_id}: {purchase_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Option<Purchase>>>

  /**
   * Construct and simulate a get_purchase_history transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_purchase_history: ({account}: {account: string}, options?: MethodOptions) => Promise<AssembledTransaction<Array<Purchase>>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions &
      Omit<ContractClientOptions, "contractId"> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: "hex" | "base64";
      }
  ): Promise<AssembledTransaction<T>> {
    return ContractClient.deploy(null, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAAAQAAAAAAAAAAAAAABkNvbmZpZwAAAAAABAAAAAAAAAAFYWRtaW4AAAAAAAATAAAAVFNvcm9iYW4gdG9rZW4gY29udHJhY3QgdXNlZCBmb3Igc2V0dGxlbWVudCAoZm9yIGV4YW1wbGUgdGhlIFN0ZWxsYXIgYXNzZXQgY29udHJhY3QpLgAAAAVhc3NldAAAAAAAABMAAAAAAAAAFG1hcmtldHBsYWNlX2NvbnRyYWN0AAAAEwAAAAAAAAAMbmZ0X2NvbnRyYWN0AAAAEw==",
        "AAAAAQAAAJNBQkkgc2hhcmVkIHdpdGggdGhlIG1hcmtldHBsYWNlIGNvbnRyYWN0LiBUaGUgbWFya2V0cGxhY2UgbXVzdCBwZXJzaXN0IGl0cwpsaXN0aW5ncyBpbiBhIGNvbXBhdGlibGUgc2hhcGUgYW5kIG9ubHkgY29tcGxldGUgYW4gYWN0aXZlIGxpc3Rpbmcgb25jZS4AAAAAAAAAAAdMaXN0aW5nAAAAAAcAAAAAAAAABmFjdGl2ZQAAAAAAAQAAAAAAAAAFYXNzZXQAAAAAAAATAAAAAAAAAApsaXN0aW5nX2lkAAAAAAAGAAAAAAAAAAxuZnRfY29udHJhY3QAAAATAAAAAAAAAAVwcmljZQAAAAAAAAsAAAAAAAAABnNlbGxlcgAAAAAAEwAAAAAAAAAIdG9rZW5faWQAAAAE",
        "AAAAAQAAAAAAAAAAAAAACFB1cmNoYXNlAAAADQAAAAAAAAAFYXNzZXQAAAAAAAATAAAAAAAAAAVidXllcgAAAAAAABMAAAAAAAAAD2xlZGdlcl9zZXF1ZW5jZQAAAAAEAAAAAAAAAApsaXN0aW5nX2lkAAAAAAAGAAAAAAAAABRtYXJrZXRwbGFjZV9jb250cmFjdAAAABMAAAAAAAAADG5mdF9jb250cmFjdAAAABMAAAAAAAAAC3B1cmNoYXNlX2lkAAAAAAYAAAAAAAAADnB1cmNoYXNlX3ByaWNlAAAAAAALAAAAAAAAAA9wdXJjaGFzZV9zdGF0dXMAAAAABAAAAAAAAAAScHVyY2hhc2VfdGltZXN0YW1wAAAAAAAGAAAAAAAAAAZzZWxsZXIAAAAAABMAAAAAAAAACHRva2VuX2lkAAAABAAAAI5Tb3JvYmFuIGNvbnRyYWN0cyBkbyBub3QgaGF2ZSB0aGUgZW5jbG9zaW5nIHRyYW5zYWN0aW9uIGhhc2guIFRoZSBBUEkKcGVyc2lzdHMgdGhlIFJQQy1jb25maXJtZWQgaGFzaCBpbiBpdHMgcHVyY2hhc2UgcmVjb3JkIGFmdGVyIHNldHRsZW1lbnQuAAAAAAAQdHJhbnNhY3Rpb25faGFzaAAAABA=",
        "AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAABgAAAAAAAAAAAAAABkNvbmZpZwAAAAAAAAAAAAAAAAANUHVyY2hhc2VDb3VudAAAAAAAAAEAAAAAAAAACFB1cmNoYXNlAAAAAQAAAAYAAAABAAAAAAAAAA9MaXN0aW5nUHVyY2hhc2UAAAAAAQAAAAYAAAABAAAAAAAAAAxCdXllckhpc3RvcnkAAAABAAAAEwAAAAEAAAAAAAAADVNlbGxlckhpc3RvcnkAAAAAAAABAAAAEw==",
        "AAAABAAAAAAAAAAAAAAADVB1cmNoYXNlRXJyb3IAAAAAAAALAAAAAAAAABJBbHJlYWR5SW5pdGlhbGl6ZWQAAAAAAAEAAAAAAAAADk5vdEluaXRpYWxpemVkAAAAAAACAAAAAAAAAA9MaXN0aW5nTm90Rm91bmQAAAAAAwAAAAAAAAAPTGlzdGluZ0luYWN0aXZlAAAAAAQAAAAAAAAADUJ1eWVySXNTZWxsZXIAAAAAAAAFAAAAAAAAABRPZmZlcmVkUHJpY2VNaXNtYXRjaAAAAAYAAAAAAAAADkludmFsaWRMaXN0aW5nAAAAAAAHAAAAAAAAAAxJbnZhbGlkUHJpY2UAAAAIAAAAAAAAABBOZnRPd25lck1pc21hdGNoAAAACQAAAAAAAAAQQWxyZWFkeVB1cmNoYXNlZAAAAAoAAAAAAAAAF093bmVyc2hpcFRyYW5zZmVyRmFpbGVkAAAAAAs=",
        "AAAAAAAAAAAAAAAKaW5pdGlhbGl6ZQAAAAAABAAAAAAAAAAFYWRtaW4AAAAAAAATAAAAAAAAAAxuZnRfY29udHJhY3QAAAATAAAAAAAAABRtYXJrZXRwbGFjZV9jb250cmFjdAAAABMAAAAAAAAABWFzc2V0AAAAAAAAEwAAAAEAAAPpAAAD7QAAAAAAAAfQAAAADVB1cmNoYXNlRXJyb3IAAAA=",
        "AAAAAAAAAI5TZXR0bGVzIHBheW1lbnQgYW5kIE5GVCBkZWxpdmVyeSBhdG9taWNhbGx5LiBUaGUgYnV5ZXIgYXV0aG9yaXplcyB0aGlzCmludm9jYXRpb247IHRoZSBtYXJrZXRwbGFjZSBlbmZvcmNlcyB0aGUgc2VsbGVyJ3MgbGlzdGluZy9lc2Nyb3cgcnVsZXMuAAAAAAAJYnV5X211c2ljAAAAAAAAAwAAAAAAAAAKbGlzdGluZ19pZAAAAAAABgAAAAAAAAAFYnV5ZXIAAAAAAAATAAAAAAAAAA1vZmZlcmVkX3ByaWNlAAAAAAAACwAAAAEAAAPpAAAH0AAAAAhQdXJjaGFzZQAAB9AAAAANUHVyY2hhc2VFcnJvcgAAAA==",
        "AAAAAAAAAAAAAAAMZ2V0X3B1cmNoYXNlAAAAAQAAAAAAAAALcHVyY2hhc2VfaWQAAAAABgAAAAEAAAPoAAAH0AAAAAhQdXJjaGFzZQ==",
        "AAAAAAAAAAAAAAAUZ2V0X3B1cmNoYXNlX2hpc3RvcnkAAAABAAAAAAAAAAdhY2NvdW50AAAAABMAAAABAAAD6gAAB9AAAAAIUHVyY2hhc2U=" ]),
      options
    )
  }
  public readonly fromJSON = {
    initialize: this.txFromJSON<Result<void>>,
        buy_music: this.txFromJSON<Result<Purchase>>,
        get_purchase: this.txFromJSON<Option<Purchase>>,
        get_purchase_history: this.txFromJSON<Array<Purchase>>
  }
}