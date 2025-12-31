# Development Environment Setup

## Quick Start (From Scratch)

When you restart your local node and everything is wiped, use this single command to set up everything:

```bash
# 1. Start your local Hardhat node (in a separate terminal)
pnpm hardhat node

# 2. Run the complete setup script (in another terminal)
pnpm hardhat run scripts/setup-full-dev-environment.ts --network localhost
```

## What This Script Does

The `setup-full-dev-environment.ts` script performs a complete setup:

1. **Deploys All Contracts**
   - WrappedVery (WVERY)
   - BumdexFactory
   - BumdexRouter
   - Launchpad
   - LaunchpadV2

2. **Wraps VERY Tokens**
   - Deployer: 100,000 WVERY
   - User1: 50,000 WVERY
   - User2: 50,000 WVERY

3. **Creates 3 Test Campaigns**
   - **AlphaToken (ALPHA)**: 10M supply, 500 WVERY goal
   - **BetaToken (BETA)**: 5M supply, 1000 WVERY goal
   - **GammaToken (GAMMA)**: 20M supply, 2000 WVERY goal

4. **Funds All Campaigns to Completion**
   - Each campaign reaches its funding goal
   - Campaigns are marked as completed
   - Tokens are distributed

5. **Adds Liquidity to All Pools**
   - Creates trading pairs with BumdexRouter
   - Adds initial liquidity (20% of funding goal)
   - Makes pools ready for swaps

6. **Performs Test Swaps**
   - Executes sample swaps on 2 pools
   - Verifies routing works correctly

## Expected Output

```
╔═══════════════════════════════════════════════════════════╗
║   VeryLaunch - Full Development Environment Setup        ║
╚═══════════════════════════════════════════════════════════╝

📦 STEP 1: Deploying all contracts...
✅ All contracts deployed!

💰 STEP 2: Wrapping VERY tokens...
✅ Deployer wrapped 100,000 VERY
✅ User1 wrapped 50,000 VERY
✅ User2 wrapped 50,000 VERY

🚀 STEP 3: Creating test campaigns...
✅ Campaign 1 created! (AlphaToken)
✅ Campaign 2 created! (BetaToken)
✅ Campaign 3 created! (GammaToken)

💸 STEP 4: Funding campaigns...
✅ All campaigns funded and completed!

🌊 STEP 5: Adding liquidity...
✅ All pools have liquidity!

🔄 STEP 6: Performing test swaps...
✅ Test swaps completed!

╔═══════════════════════════════════════════════════════════╗
║                    SETUP COMPLETE! ✅                     ║
╚═══════════════════════════════════════════════════════════╝
```

## After Setup

Your local development environment is now ready:

1. **Frontend**: Open http://localhost:3000
2. **Wallet**: Connect with deployer address (`0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`)
3. **Campaigns**: Browse 3 active campaigns
4. **Pools**: View pool metrics and liquidity
5. **Swaps**: Test token swaps

## Troubleshooting

### "Connection refused" error
Make sure your Hardhat node is running:
```bash
pnpm hardhat node
```

### "Contract not deployed" error
The script includes deployment - just run it again

### Want to reset everything?
1. Stop the Hardhat node (Ctrl+C)
2. Restart it (`pnpm hardhat node`)
3. Run the setup script again

## Manual Steps (Alternative)

If you want to run steps individually:

```bash
# Deploy contracts
pnpm hardhat deploy --network localhost

# Create campaigns
pnpm hardhat run scripts/demo-full-flow.ts --network localhost

# Add liquidity
pnpm hardhat run scripts/add-initial-liquidity.ts --network localhost
```

But the all-in-one script is much easier! 🚀
