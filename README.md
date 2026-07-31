# NFT Music

> Mint and collect music NFTs on Stellar testnet.

**Frontend (Vercel):** https://nft-music-qym1.vercel.app/  
**Backend (Render):** https://nft-music.onrender.com

[![Vercel](https://img.shields.io/badge/Frontend-Vercel-black?logo=vercel)](https://nft-music-qym1.vercel.app/)
[![Render](https://img.shields.io/badge/Backend-Render-blue?logo=render)](https://nft-music.onrender.com)

## GitHub Actions Status

[![CI](https://github.com/donendosted/NFT_MUSIC/actions/workflows/ci.yml/badge.svg)](https://github.com/donendosted/NFT_MUSIC/actions/workflows/ci.yml)
[![CD](https://github.com/donendosted/NFT_MUSIC/actions/workflows/cd.yml/badge.svg)](https://github.com/donendosted/NFT_MUSIC/actions/workflows/cd.yml)

## Smart Contract (Deployed)

- **Music NFT Contract ID (Testnet):** `CAGUOSXM3MURD2C7V3EKJ67OGKZKWB3QXRPJN36AKKXKDV43I5YPZEBK`

## Atomic Purchase Settlement (Testnet)

The original NFT contract above remains deployed. A transfer-capable v2 NFT,
an escrow marketplace, and a dedicated purchase contract were added alongside
it so listed music can settle atomically without removing existing contracts.

- **Music NFT v2:** `CAUBEZ6RC7PWP47FZVBKHPVQ6BRS57FPVPZELZFMVINFNZKOEY6L3MXD`
- **Escrow Marketplace:** `CBWB4TRYIMG5KQSI6HIKRZIUTYHIGNJ4EHUA4PTO6R3TJSHBXCDB56HE`
- **Music Purchase Contract:** `CD4FPDV7VCCVKQBIKU6MBVUPJFW6KMRMB5H4JT6ENR27QWKIPDYQKE5H`
- **Settlement asset:** native XLM, represented by Soroban contract `CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC`

The purchase contract transfers XLM to the seller, calls the escrow
marketplace to deliver the NFT, deactivates the listing, stores the purchase,
and emits `purchase/complete` in one Soroban transaction. A failure anywhere
in that sequence reverts the whole transaction.

### Verified Testnet Purchase

The complete mint → list → buy path was verified using the deployed contracts:

- [Mint test NFT #1](https://stellar.expert/explorer/testnet/tx/28c5a5e4ec44b7659ea20aecc7d9137d57878eda80bd7b19218cadd92d002696)
- [List it for 1 XLM](https://stellar.expert/explorer/testnet/tx/6008757b77368a1dc3e0b93303ad301ed7ec04d8efa28974cad564ad529c1dee)
- [Atomic purchase](https://stellar.expert/explorer/testnet/tx/905fda6229469c7fa6457e8bf7e0d9b6037800ad672d1211be751ff0f31c614a)

The buyer `GBRHS7...P5TA` became the NFT owner, the seller received exactly
`1,000,000` stroops, listing `1` is inactive, and purchase `1` is recorded in
ledger `3900582`.

### Purchase Configuration

Set the following server environment variables (the same values are present in
`backend/.env.example`) before running the backend:

```env
NFT_CONTRACT_ID=CAUBEZ6RC7PWP47FZVBKHPVQ6BRS57FPVPZELZFMVINFNZKOEY6L3MXD
MUSIC_PURCHASE_CONTRACT_ID=CD4FPDV7VCCVKQBIKU6MBVUPJFW6KMRMB5H4JT6ENR27QWKIPDYQKE5H
MARKETPLACE_CONTRACT_ID=CBWB4TRYIMG5KQSI6HIKRZIUTYHIGNJ4EHUA4PTO6R3TJSHBXCDB56HE
PAYMENT_ASSET_CONTRACT_ID=CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC
```

`POST /api/purchase/build` prepares and simulates the Freighter-signable
transaction. `POST /api/purchase` submits it, polls Soroban RPC, persists the
confirmed purchase, and returns the real RPC transaction hash and Stellar
Expert URL.

Because v1 and v2 token IDs overlap, run this one-time database migration after
deploying the backend so tokens are uniquely identified by both contract and
token ID:

```bash
cd backend
npm run migrate:music-indexes
```

## Very Short App Workflow

1. Upload audio to Pinata from the mint page.
2. Backend gets `ipfsHash` and builds unsigned Soroban mint transaction.
3. User signs in Freighter wallet.
4. Backend submits signed tx to Stellar testnet and stores minted NFT record.

## Video Demo



https://github.com/user-attachments/assets/3c389887-cf17-46da-af80-85d355949d08


## Mobile Responsive View

<img width="414" height="828" alt="Screenshot 2026-04-25 at 12-10-09 NFT Music - Mint   Collect Music NFTs" src="https://github.com/user-attachments/assets/8c43d51e-c1a4-41ca-a74f-c3bb679f5851" />
<img width="414" height="828" alt="Screenshot 2026-04-25 at 12-10-37 NFT Music - Mint   Collect Music NFTs" src="https://github.com/user-attachments/assets/381513f6-ed53-42d1-934f-02dbd867d4a9" />
<img width="414" height="828" alt="Screenshot 2026-04-25 at 12-10-47 NFT Music - Mint   Collect Music NFTs" src="https://github.com/user-attachments/assets/a4568d18-e209-4a70-9364-9fb00adf9a18" />


## How to Install (Local Development)

### Prerequisites

- Node.js 18+
- Yarn (for backend) and npm (for frontend), or install both with Node tooling
- MongoDB (local or cloud)
- Freighter wallet extension

### 1) Backend Setup

```bash
cd backend
cp .env.example .env
# Fill required values: MONGODB_URI, PINATA_JWT, NFT_CONTRACT_ID
yarn install
yarn start
```

Backend runs on `http://localhost:5000` by default.

### 2) Frontend Setup

```bash
cd frontend
cp .env.example .env.local
# NEXT_PUBLIC_API_URL=http://localhost:5000
npm install
npm run dev
```

Frontend runs on `http://localhost:3000` by default.

## Environment Variables

### Backend (`backend/.env`)

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/nft_music
PINATA_JWT=your_pinata_jwt_token
NFT_CONTRACT_ID=CAGUOSXM3MURD2C7V3EKJ67OGKZKWB3QXRPJN36AKKXKDV43I5YPZEBK
STELLAR_RPC_URL=https://soroban-testnet.stellar.org
STELLAR_NETWORK=testnet
# Optional:
# STELLAR_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
IPFS_GATEWAY_URL=https://gateway.pinata.cloud/ipfs
```

### MongoDB connection troubleshooting

Minting stores the confirmed on-chain NFT in MongoDB immediately after Soroban
confirms the transaction. Set `MONGODB_URI` to a reachable MongoDB deployment
before starting the backend. The `/health` endpoint reports `database:
"connected"` when ready; a `503`/`database: "unavailable"` response means the
URI, credentials, or MongoDB network access list must be corrected first.

### Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_NETWORK=testnet
```

## CI/CD

- `ci.yml`: Runs frontend lint/build + backend checks on PRs and pushes to `main`.
- `cd.yml`: Triggers Vercel and Render deploy hooks after CI succeeds on `main`.

Required GitHub repository secrets:

- `VERCEL_DEPLOY_HOOK_URL`
- `RENDER_DEPLOY_HOOK_URL`

## Developer

donendosted
