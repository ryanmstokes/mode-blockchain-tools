# Mode Network Explorer Tools

This app queries the Mode network explorer (https://explorer.mode.network/api-docs) API to check for wallets that have been liquidated by specific contracts.

The app allows the user to enter a users wallet address and:

1. Filters the txs of the wallet that have methods of "safeLiquidateToTokensWithFlashLoan".
   (https://explorer.mode.network/api/v2/walletID/transactions)
2. Filters token transfers of a wallet that have been sent to a specific walleet.
   (https://explorer.mode.network/api/v2/walletID/token-transfers)

Any transactions and token transfers that are identified as liqiuidations are returned.

## Setup

Install the dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development Server

Start the development server on `http://localhost:3000`:

vist `http://localhost:3000/check-liquidation`

```bash
# npm
npm run dev

# pnpm
pnpm run dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm run build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm run preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.
