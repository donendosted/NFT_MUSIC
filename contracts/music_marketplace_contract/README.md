# Music Marketplace Escrow Contract

This companion contract exists because the repository contained no marketplace
Soroban contract, even though `music_purchase_contract` needs an on-chain
listing source. It does not process payments.

- `list_music` validates seller ownership and escrows the NFT.
- `get_listing` supplies the ABI consumed by `music_purchase_contract`.
- `complete_sale` is restricted to the configured purchase contract and releases
  the escrowed NFT only as part of an atomic purchase.

Build with the existing Soroban SDK 20 toolchain:

```bash
RUSTUP_TOOLCHAIN=1.85.1 stellar contract build
```
