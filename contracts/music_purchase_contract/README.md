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
