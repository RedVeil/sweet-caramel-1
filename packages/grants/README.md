# @popcorn/grants

### Dev setup instructions

1. set `CHAIN_ID=1337` in .env

the following will be run from `packages/hardhat`:
2. run `yarn hardhat node --tags beneficiary-governance,test-pop,region,participation-reward,gov-staking,beneficiary-registry --network hardhat`
3. get deployed address of BeneficiaryGovernance contract from output and add it to scripts/AddNominationProposal.s.sol
4. run `forge script scripts/AddNominationProposal.s.sol --rpc-url http://localhost:8545 --chain-id 1337 --sender 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 --broadcast -i 1` with private key from 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
5. `yarn export`

now in this directory:
1. `yarn next dev`




