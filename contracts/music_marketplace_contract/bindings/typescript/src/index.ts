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
  asset: string;
  nft_contract: string;
  purchase_contract: string;
}


/**
 * Kept byte-for-byte compatible with `music_purchase_contract::Listing`.
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

export type DataKey = {tag: "Config", values: void} | {tag: "ListingCount", values: void} | {tag: "Listing", values: readonly [u64]} | {tag: "TokenListing", values: readonly [u32]};

export const MarketplaceError = {
  1: {message:"AlreadyInitialized"},
  2: {message:"NotInitialized"},
  3: {message:"InvalidPrice"},
  4: {message:"TokenAlreadyListed"},
  5: {message:"NotTokenOwner"},
  6: {message:"ListingNotFound"},
  7: {message:"ListingInactive"},
  8: {message:"UnauthorizedSettlement"},
  9: {message:"EscrowOwnerMismatch"}
}

/**
 * Mirrors the error values exported by the Music NFT contract.
 */
export const MusicNftError = {
  1: {message:"TokenNotFound"},
  2: {message:"NotTokenOwner"}
}

export interface Client {
  /**
   * Construct and simulate a initialize transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  initialize: ({admin, nft_contract, asset, purchase_contract}: {admin: string, nft_contract: string, asset: string, purchase_contract: string}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a list_music transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Seller authorizes escrow of a Music NFT and creates an active listing.
   */
  list_music: ({seller, token_id, price}: {seller: string, token_id: u32, price: i128}, options?: MethodOptions) => Promise<AssembledTransaction<Result<u64>>>

  /**
   * Construct and simulate a get_listing transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_listing: ({listing_id}: {listing_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Option<Listing>>>

  /**
   * Construct and simulate a complete_sale transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Only the configured purchase contract can release an escrowed NFT.
   */
  complete_sale: ({listing_id, buyer}: {listing_id: u64, buyer: string}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

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
      new ContractSpec([ "AAAAAQAAAAAAAAAAAAAABkNvbmZpZwAAAAAABAAAAAAAAAAFYWRtaW4AAAAAAAATAAAAAAAAAAVhc3NldAAAAAAAABMAAAAAAAAADG5mdF9jb250cmFjdAAAABMAAAAAAAAAEXB1cmNoYXNlX2NvbnRyYWN0AAAAAAAAEw==",
        "AAAAAQAAAEZLZXB0IGJ5dGUtZm9yLWJ5dGUgY29tcGF0aWJsZSB3aXRoIGBtdXNpY19wdXJjaGFzZV9jb250cmFjdDo6TGlzdGluZ2AuAAAAAAAAAAAAB0xpc3RpbmcAAAAABwAAAAAAAAAGYWN0aXZlAAAAAAABAAAAAAAAAAVhc3NldAAAAAAAABMAAAAAAAAACmxpc3RpbmdfaWQAAAAAAAYAAAAAAAAADG5mdF9jb250cmFjdAAAABMAAAAAAAAABXByaWNlAAAAAAAACwAAAAAAAAAGc2VsbGVyAAAAAAATAAAAAAAAAAh0b2tlbl9pZAAAAAQ=",
        "AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAABAAAAAAAAAAAAAAABkNvbmZpZwAAAAAAAAAAAAAAAAAMTGlzdGluZ0NvdW50AAAAAQAAAAAAAAAHTGlzdGluZwAAAAABAAAABgAAAAEAAAAAAAAADFRva2VuTGlzdGluZwAAAAEAAAAE",
        "AAAABAAAAAAAAAAAAAAAEE1hcmtldHBsYWNlRXJyb3IAAAAJAAAAAAAAABJBbHJlYWR5SW5pdGlhbGl6ZWQAAAAAAAEAAAAAAAAADk5vdEluaXRpYWxpemVkAAAAAAACAAAAAAAAAAxJbnZhbGlkUHJpY2UAAAADAAAAAAAAABJUb2tlbkFscmVhZHlMaXN0ZWQAAAAAAAQAAAAAAAAADU5vdFRva2VuT3duZXIAAAAAAAAFAAAAAAAAAA9MaXN0aW5nTm90Rm91bmQAAAAABgAAAAAAAAAPTGlzdGluZ0luYWN0aXZlAAAAAAcAAAAAAAAAFlVuYXV0aG9yaXplZFNldHRsZW1lbnQAAAAAAAgAAAAAAAAAE0VzY3Jvd093bmVyTWlzbWF0Y2gAAAAACQ==",
        "AAAABAAAADxNaXJyb3JzIHRoZSBlcnJvciB2YWx1ZXMgZXhwb3J0ZWQgYnkgdGhlIE11c2ljIE5GVCBjb250cmFjdC4AAAAAAAAADU11c2ljTmZ0RXJyb3IAAAAAAAACAAAAAAAAAA1Ub2tlbk5vdEZvdW5kAAAAAAAAAQAAAAAAAAANTm90VG9rZW5Pd25lcgAAAAAAAAI=",
        "AAAAAAAAAAAAAAAKaW5pdGlhbGl6ZQAAAAAABAAAAAAAAAAFYWRtaW4AAAAAAAATAAAAAAAAAAxuZnRfY29udHJhY3QAAAATAAAAAAAAAAVhc3NldAAAAAAAABMAAAAAAAAAEXB1cmNoYXNlX2NvbnRyYWN0AAAAAAAAEwAAAAEAAAPpAAAD7QAAAAAAAAfQAAAAEE1hcmtldHBsYWNlRXJyb3I=",
        "AAAAAAAAAEZTZWxsZXIgYXV0aG9yaXplcyBlc2Nyb3cgb2YgYSBNdXNpYyBORlQgYW5kIGNyZWF0ZXMgYW4gYWN0aXZlIGxpc3RpbmcuAAAAAAAKbGlzdF9tdXNpYwAAAAAAAwAAAAAAAAAGc2VsbGVyAAAAAAATAAAAAAAAAAh0b2tlbl9pZAAAAAQAAAAAAAAABXByaWNlAAAAAAAACwAAAAEAAAPpAAAABgAAB9AAAAAQTWFya2V0cGxhY2VFcnJvcg==",
        "AAAAAAAAAAAAAAALZ2V0X2xpc3RpbmcAAAAAAQAAAAAAAAAKbGlzdGluZ19pZAAAAAAABgAAAAEAAAPoAAAH0AAAAAdMaXN0aW5nAA==",
        "AAAAAAAAAEJPbmx5IHRoZSBjb25maWd1cmVkIHB1cmNoYXNlIGNvbnRyYWN0IGNhbiByZWxlYXNlIGFuIGVzY3Jvd2VkIE5GVC4AAAAAAA1jb21wbGV0ZV9zYWxlAAAAAAAAAgAAAAAAAAAKbGlzdGluZ19pZAAAAAAABgAAAAAAAAAFYnV5ZXIAAAAAAAATAAAAAQAAA+kAAAPtAAAAAAAAB9AAAAAQTWFya2V0cGxhY2VFcnJvcg==" ]),
      options
    )
  }
  public readonly fromJSON = {
    initialize: this.txFromJSON<Result<void>>,
        list_music: this.txFromJSON<Result<u64>>,
        get_listing: this.txFromJSON<Option<Listing>>,
        complete_sale: this.txFromJSON<Result<void>>
  }
}