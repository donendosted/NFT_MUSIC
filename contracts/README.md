# Music NFT Smart Contract

A Soroban smart contract for minting and managing music NFTs on Stellar testnet.

## Prerequisites

1. Install Stellar CLI:
```bash
curl -L https://github.com/stellar/stellar-cli/releases/latest/download/soroban-cli-x86_64-unknown-linux-gnu.tar.gz | tar xz
chmod +x soroban
sudo mv soroban /usr/local/bin/
```

2. Create a funded account on Stellar testnet:
```bash
soroban keys generate testnet-account --fund
```

## Build

```bash
cd contracts/music_nft
soroban contract build
```

## Deploy to Testnet

```bash
soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/music_nft.wasm \
  --source testnet-account \
  --network testnet
```

This returns your contract ID. Add it to your backend `.env`:
```
NFT_CONTRACT_ID=CAABC123...your_contract_id
```

## Usage

After deployment, update `backend/src/routes/mintRoutes.js` with your contract ID.

## Functions

- `mint(owner, name, music_url, artist)` - Mint a new music NFT
- `get_owner(token_id)` - Get owner of a token
- `get_metadata(token_id)` - Get metadata (name, url, artist)
- `get_tokens_by_owner(owner)` - Get all tokens owned by an address
- `total_supply()` - Get total number of minted NFTs
- `transfer(from, to, token_id)` - Transfer an NFT; used by the marketplace's
  escrow settlement path for atomic purchases.
