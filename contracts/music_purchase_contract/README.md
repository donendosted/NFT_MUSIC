# Music Purchase Contract

`music_purchase_contract` settles a listed Music NFT atomically:

1. Reads and validates an active listing.
2. Transfers the configured Soroban token asset from buyer to seller.
3. Asks the marketplace to transfer the NFT and close the listing.
4. Verifies the new NFT owner, stores purchase data, and emits `purchase/complete`.

Soroban atomically rolls back every nested contract invocation if any validation,
payment, or ownership transfer fails.

## Required marketplace interface

The repository did not contain a marketplace contract at the time this contract
was added. The deployed marketplace must expose the following ABI, with the
`Listing` fields in this exact order and type:

```rust
get_listing(listing_id: u64) -> Option<Listing>
complete_sale(listing_id: u64, buyer: Address)
```

`complete_sale` must enforce the seller listing authorization or escrow, transfer
the NFT to `buyer`, and deactivate the listing. The NFT contract must expose
`get_owner(token_id: u32) -> Option<Address>` and transfer ownership through the
marketplace's completion path.

## Build and deploy

```bash
stellar contract build
stellar contract optimize --wasm target/wasm32-unknown-unknown/release/music_purchase_contract.wasm
stellar contract deploy --wasm target/wasm32-unknown-unknown/release/music_purchase_contract.optimized.wasm --source <funded-key> --network testnet
```

After deployment, initialize once with the admin, NFT contract ID, marketplace
contract ID, and Soroban token contract ID for the payment asset.

## Testnet deployment

- Contract ID: `CD4FPDV7VCCVKQBIKU6MBVUPJFW6KMRMB5H4JT6ENR27QWKIPDYQKE5H`
- Deploy transaction: [`ab2825e70f5843581af4a8cb72bb8c9bd1994d4efef34c71a1018e742fec4d3e`](https://stellar.expert/explorer/testnet/tx/ab2825e70f5843581af4a8cb72bb8c9bd1994d4efef34c71a1018e742fec4d3e)

The contract was initialized with the companion escrow marketplace, Music NFT
v2, and the native-XLM testnet Soroban asset. The original NFT deployment was
not removed or replaced.
