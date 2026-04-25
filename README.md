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
