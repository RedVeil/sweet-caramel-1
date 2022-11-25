# @popcorn/grants

### Dev setup instructions

1. set `CHAIN_ID=1337` in .env

the following will be run from `packages/hardhat`:

2. run `yarn dev-grants`

3. get deployed address of BeneficiaryGovernance and Pop contract from output and add it to scripts/benGov/AddNominationProposal.s.sol

4. You will also have to put these addresses into the hardhat keys in namedAccounts.json

5. Make sure you have an .env file in packages/hardhat which contains the following env var:
`PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`

6. run `forge script scripts/benGov/AddNominationProposal.s.sol:AddProposal --rpc-url http://localhost:8545 --chain-id 1337 --sender 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 --broadcast -i 1` with private key from 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
(It will ask you to supply the private key after the command has run and it has compiled)

7. `yarn export`

now in this grants directory:
8. `yarn next dev`




