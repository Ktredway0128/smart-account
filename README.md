# SMART ACCOUNT — ERC-4337 ACCOUNT ABSTRACTION

[![SmartAccountFactory on Etherscan](https://img.shields.io/badge/Etherscan-Verified-brightgreen)](https://sepolia.etherscan.io/address/0xe6223dB0982919e16B442f590f4F7F6d45E69324#code)
[![Paymaster on Etherscan](https://img.shields.io/badge/Etherscan-Verified-brightgreen)](https://sepolia.etherscan.io/address/0x22D05F39E260b9fDE64d3FFa86E8f494Cfe9C396#code)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![Solidity](https://img.shields.io/badge/Solidity-0.8.28-blue)
![Hardhat](https://img.shields.io/badge/Built%20with-Hardhat-yellow)

Built by [Tredway Development](https://tredwaydev.com) — professional Solidity smart contract packages for Web3 companies.

A production-ready ERC-4337 Account Abstraction system built with Solidity, OpenZeppelin v5, and the official account-abstraction package.

> ⚠️ These contracts have not been professionally audited. A full security audit is strongly recommended before any mainnet deployment.

This project implements a complete minimal ERC-4337 system — a SmartAccount wallet-as-a-contract, a Factory for deterministic account deployment, and a Paymaster for gas sponsorship. Together they enable gasless transactions, social recovery, and programmable wallet logic without changing the Ethereum protocol.

Smart contract development
Automated testing
Deployment scripting
Security best practices

## PROJECT GOALS

The purpose of this project is to demonstrate a complete ERC-4337 Account Abstraction implementation — the infrastructure layer that makes Web3 wallets as easy to use as any regular app.

The system includes the three core contracts required by a production AA deployment:

SmartAccount — wallet-as-a-contract with owner-controlled execution and signature validation
SmartAccountFactory — deterministic account deployment using Create2
Paymaster — gas sponsorship so users never need ETH to interact


## SMART CONTRACT FEATURES

SMART ACCOUNT

A wallet implemented as a smart contract extending ERC-4337's BaseAccount. The owner signs UserOperations which are validated on chain. The account can execute any transaction — ETH transfers, contract calls, or encoded function calls — when called by the EntryPoint or the owner directly.

SMART ACCOUNT FACTORY

Deploys new SmartAccounts on demand using Create2 for deterministic address generation. The account address is predictable before deployment — users can receive funds at their future address before the account even exists. Re-deploying with the same owner and salt returns the existing account without creating a duplicate.

PAYMASTER

Sponsors gas fees on behalf of users so they never need ETH to interact with a dApp. Extends ERC-4337's BasePaymaster. The simple implementation approves all operations — production deployments can add rules like whitelists, spending limits, or per-user quotas.

SIGNATURE VALIDATION

The SmartAccount validates that each UserOperation was signed by the owner using ECDSA signature recovery. Returns 0 for valid signatures and 1 for invalid — the standard ERC-4337 validation pattern.

COUNTERFACTUAL DEPLOYMENT

The factory's getAddress function computes the SmartAccount address before it is deployed. This enables pre-funding and counterfactual interactions — a core feature of production AA systems.

NONCE MANAGEMENT

The SmartAccount exposes getNonce() which reads the current nonce from the EntryPoint. The EntryPoint tracks nonces per account to prevent UserOperation replay attacks.

EVENT TRACKING

The contracts emit events for every major action:

SmartAccountInitialized — on account creation

TransactionExecuted — on every execution

OperationSponsored — on every sponsored UserOperation


## TECHNOLOGY STACK

Solidity – Smart contract programming language

Hardhat – Ethereum development environment

OpenZeppelin Contracts v5 – Secure smart contract libraries

account-abstraction – Official ERC-4337 base contracts from eth-infinitism

Mocha & Chai – JavaScript testing framework

Alchemy – Ethereum RPC provider

Sepolia Test Network – Deployment environment


## PROJECT STRUCTURE

contracts/
    SmartAccount.sol
    SmartAccountFactory.sol
    Paymaster.sol
    MockEntryPoint.sol

scripts/
    deploy.js

test/
    SmartAccount.test.js

hardhat.config.js
.env

CONTRACTS

SmartAccount.sol is the core wallet contract. SmartAccountFactory.sol handles deterministic deployment. Paymaster.sol sponsors gas fees. MockEntryPoint.sol is a test harness only — not deployed to production networks.

SCRIPTS

deploy.js deploys MockEntryPoint on localhost or uses the live EntryPoint on Sepolia, then deploys SmartAccountFactory and Paymaster, creates a demo SmartAccount via the factory, saves all addresses to a JSON file, and verifies on Etherscan when deploying to Sepolia.

TESTS

Contains 22 automated tests covering SmartAccount, SmartAccountFactory, and Paymaster.


## SMART CONTRACT ARCHITECTURE

The system follows the ERC-4337 standard without modifying the Ethereum protocol:

UserOperation → alt mempool → Bundler → EntryPoint → validateUserOp → execute

SmartAccount extends BaseAccount and implements _validateSignature using ECDSA recovery and _requireFromEntryPointOrOwner for access control.

SmartAccountFactory uses OpenZeppelin's Create2 library for deterministic address computation. The same owner and salt always produce the same address on any network.

Paymaster extends BasePaymaster and implements _validatePaymasterUserOp. The current implementation approves all operations and emits an OperationSponsored event. Production rules can be added without changing the interface.

The real EntryPoint is deployed at the same address on all EVM networks:

0x0000000071727De22E5E9d8BAf0edAc6f37da032


## DASHBOARD

Live dashboard: [account-abstraction-dashboard.netlify.app](https://account-abstraction-dashboard.netlify.app)

Demo video: [YouTube](https://youtu.be/Z47AWnMaIoM)

Dashboard repository: [aa-dashboard](https://github.com/Ktredway0128/aa-dashboard)


## INSTALLATION

### CLONE THE REPOSITORY:

git clone https://github.com/Ktredway0128/smart-account

cd smart-account

### INSTALL DEPENDENCIES:

npm install

### COMPILE THE CONTRACTS:

npx hardhat compile

### RUN THE TEST SUITE:

npx hardhat test

### THE TESTS VALIDATE:

Correct owner and entryPoint setup at deployment

SmartAccountInitialized event emission

ETH deposit via receive function

Transaction execution by owner

Transaction execution by entryPoint

Rejection of execution by non-owner

TransactionExecuted event emission

Valid owner signature returns 0

Invalid signature returns 1

Returns correct nonce from entryPoint

Factory deploys SmartAccount for new owner

Factory returns same address for same owner and salt

Factory returns different addresses for different salts

Factory returns different addresses for different owners

Factory does not redeploy existing accounts

Factory sets correct owner on deployed SmartAccount

Factory sets correct entryPoint on deployed SmartAccount

Paymaster sets correct entryPoint

Paymaster sets deployer as owner

Paymaster approves any user operation

Paymaster emits OperationSponsored event

MockEntryPoint supportsInterface validation


## ENVIRONMENT SETUP

Create a .env file in the root directory.

ALCHEMY_API_URL=YOUR_SEPOLIA_RPC_URL

DEPLOYER_PRIVATE_KEY=YOUR_PRIVATE_KEY

ETHERSCAN_API_KEY=YOUR_ETHERSCAN_API_KEY


## DEPLOYMENT

### LOCAL DEPLOYMENT:

npx hardhat node

npx hardhat run scripts/deploy.js --network localhost

On localhost the script deploys a MockEntryPoint first since the real EntryPoint only exists on live networks.

### SEPOLIA DEPLOYMENT:

npx hardhat run scripts/deploy.js --network sepolia

The deployment script performs the following steps:

Uses the live EntryPoint at 0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789

Deploys SmartAccountFactory with the EntryPoint address

Deploys Paymaster with the EntryPoint address

Creates a demo SmartAccount via the factory using salt 0

Saves all deployment addresses to deployments/sepolia.json

Waits for block confirmations

Verifies SmartAccountFactory and Paymaster on Etherscan


### SEPOLIA TESTNET DEPLOYMENT

| Contract | Address | Etherscan |
|----------|---------|-----------|
| SmartAccountFactory | 0x645B6109ac481A3CD718de39EAD349B3133F6665 | [View on Etherscan](https://sepolia.etherscan.io/address/0x645B6109ac481A3CD718de39EAD349B3133F6665#code) |
| Paymaster | 0x3650103302EC76afBA9BB10FdA71601648003655 | [View on Etherscan](https://sepolia.etherscan.io/address/0x3650103302EC76afBA9BB10FdA71601648003655#code) |
| SmartAccount (demo) | 0x54ce6C696A396AF6b33Ec99B7B7DBF5d5cA19De3 | [View on Etherscan](https://sepolia.etherscan.io/address/0x54ce6C696A396AF6b33Ec99B7B7DBF5d5cA19De3) |

Deployed: 2026/05/07


## SECURITY PRACTICES

The contracts follow ERC-4337 standard patterns including:

ECDSA signature validation — only the owner can authorize UserOperations

_requireFromEntryPointOrOwner — execution restricted to EntryPoint or owner

BaseAccount and BasePaymaster — official ERC-4337 base contracts from eth-infinitism

OpenZeppelin v5 — latest audited contract libraries

Create2 deterministic deployment — predictable addresses with no collision risk

EntryPoint nonce tracking — prevents UserOperation replay attacks


## ERC-4337 OVERVIEW

ERC-4337 enables Account Abstraction without protocol changes by introducing:

UserOperation — a new transaction type describing what the user wants to do

Alt Mempool — a separate mempool for UserOperations

Bundler — collects UserOperations and submits them to the EntryPoint

EntryPoint — validates and executes UserOperations through SmartAccounts

Paymaster — optional gas sponsor so users never need ETH


## FULL TOKEN SUITE

This contract is part of the Tredway Development token suite:

| Contract | Description |
|----------|-------------|
| SampleToken V1 | ERC-20 token with minting, burning, and pause |
| TokenVesting | Cliff and linear vesting schedules |
| TokenAirdrop | Merkle tree airdrop distribution |
| TokenStaking | ERC-20 staking with rewards |
| TokenCrowdsale | Capped token crowdsale |
| SampleToken V2 | Governance token with voting and permit |
| TimelockController | Time-delayed governance execution |
| TokenGovernance | On-chain DAO voting |
| NftMembership | ERC-721 membership NFT |
| LiquidityLock | LP token time lock |
| MultiSigWallet | Multi-owner transaction approval |
| Treasury | ETH and ERC-20 fund vault |
| SmartAccount | ERC-4337 Account Abstraction system |


## AUTHOR

Kyle Tredway

Smart Contract Developer / Token Launch Specialist

tredwaydev.com | @kyletredwaydev

## LICENSE

MIT License