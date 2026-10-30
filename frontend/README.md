# Escrow DApp Frontend

A professional, responsive React + TypeScript + Vite frontend for the Foundry `Escrow` smart contract using ethers.js v6.

## Features

- MetaMask wallet connection
- Network and wallet address display
- Escrow contract address input (no hardcoded deployed addresses)
- Displays buyer, seller, arbiter, amount, approval states, dispute state, and settlement state
- Buyer approval, seller approval, raise dispute
- Arbiter dispute resolution (pay seller / refund buyer)
- Transaction states (pending/success/error) with transaction hash
- Actions shown only when appropriate for the connected wallet and contract state
- Handles wallet rejection, missing MetaMask, invalid addresses, and transaction failures

## Prerequisites

- Node.js 18+ (tested with Node 24)
- MetaMask browser extension
- A deployed `Escrow` contract (the frontend reads from the compiled ABI in `src/escrowAbi.json`)

## Setup

```bash
cd frontend
npm install
```

## Run (development)

```bash
npm run dev
```

Open the URL shown by Vite (usually `http://localhost:5173`).

## Build

```bash
npm run build
```

## Type check

```bash
npx tsc -b --noEmit
```

## Usage notes

1. Connect MetaMask
2. Enter the deployed Escrow contract address on the connected network
3. The app will read contract state (BUYER, SELLER, ARBITER, AMOUNT, approvals, dispute/settled)
4. Perform actions as buyer/seller/arbiter as allowed by the contract

## Important

- No private keys are requested or stored
- No deployed contract addresses are hardcoded
- Frontend files are contained in `frontend/`
- This project does not deploy contracts or publish the site
