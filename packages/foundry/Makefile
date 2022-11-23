include .env

anvil:
	anvil --fork-url ${RPC_URL} --chain-id 1337 --block-time 5
deploy:
	forge script scripts/deployMockVaultAndStaking.sol --rpc-url http://localhost:8545 --chain-id 1337 --sender 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 --broadcast -i 1

# private key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
# vault: 0x2538a10b7ffb1b78c890c870fc152b10be121f04
# staking: 0x24432a08869578aaf4d1eada12e1e78f171b1a2b
# deposit token: 0xA3D87FffcE63B53E0d54fAa1cc983B7eB0b74A9c
