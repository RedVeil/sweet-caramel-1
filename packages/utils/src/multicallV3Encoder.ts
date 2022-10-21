const Web3 = require("web3");
var Contract = require("web3-eth-contract");

let web3 = new Web3(process.env.RPC_URL);

// test values
const TEST_VALUE = "42";
const TEST_ADDRESS = "0x0000000000000000000000000000000000000000";

// contract addresses
const VAULT_ADDRESS = "0x0000000000000000000000000000000000000000";
const VAULT_STAKING_ADDRESS = "0x0000000000000000000000000000000000000000";
const VAULT_V1_ZAPPER_ADDRESS = "0x0000000000000000000000000000000000000000";
const MULTICALLV3_ADDRESS = "0xcA11bde05977b3631167028862bE2a173976CA11"; // on every network the same

// we only need the aggregate fn from the multicall contract for now
const MULTICALLV3_ABI = [
  {
    inputs: [
      {
        components: [
          { internalType: "address", name: "target", type: "address" },
          { internalType: "bytes", name: "callData", type: "bytes" },
        ],
        internalType: "struct Multicall3.Call[]",
        name: "calls",
        type: "tuple[]",
      },
    ],
    name: "aggregate",
    outputs: [
      { internalType: "uint256", name: "blockNumber", type: "uint256" },
      { internalType: "bytes[]", name: "returnData", type: "bytes[]" },
    ],
    stateMutability: "payable",
    type: "function",
  },
];

const depositEncoding = web3.eth.abi.encodeFunctionCall(
  {
    name: "deposit",
    type: "function",
    inputs: [
      {
        type: "uint256",
        name: "assets",
      },
    ],
  },
  [TEST_VALUE],
);

const stakeEncoding = web3.eth.abi.encodeFunctionCall(
  {
    name: "stake",
    type: "function",
    inputs: [
      {
        type: "uint256",
        name: "amount",
      },
    ],
  },
  [TEST_VALUE],
);

const unstakeEncoding = web3.eth.abi.encodeFunctionCall(
  {
    name: "withdraw",
    type: "function",
    inputs: [
      {
        type: "uint256",
        name: "amount",
      },
    ],
  },
  [TEST_VALUE],
);

const zapInEncoding = web3.eth.abi.encodeFunctionCall(
  {
    name: "zapIn",
    type: "function",
    inputs: [
      {
        type: "address",
        name: "fromTokenAddress",
      },
      {
        type: "address",
        name: "toTokenAddress",
      },
      {
        type: "address",
        name: "pool",
      },
      {
        type: "address",
        name: "vaultAsset",
      },
      {
        type: "uint256",
        name: "incomingTokenQty",
      },
      {
        type: "uint256",
        name: "minPoolTokens",
      },
      {
        type: "address",
        name: "swapTarget",
      },
      {
        type: "bytes",
        name: "swapData",
      },
      {
        type: "bool",
        name: "stake",
      },
    ],
  },
  [TEST_ADDRESS, TEST_ADDRESS, TEST_ADDRESS, TEST_ADDRESS, TEST_VALUE, TEST_VALUE, TEST_ADDRESS, "0x", true],
);

const zapOutEncoding = web3.eth.abi.encodeFunctionCall(
  {
    name: "zapOut",
    type: "function",
    inputs: [
      {
        type: "address",
        name: "vaultAsset",
      },
      {
        type: "address",
        name: "pool",
      },
      {
        type: "uint256",
        name: "amount",
      },
      {
        type: "address",
        name: "intermediateToken",
      },
      {
        type: "address",
        name: "toToken",
      },
      {
        type: "uint256",
        name: "minToTokens",
      },
      {
        type: "address",
        name: "swapTarget",
      },
      {
        type: "bytes",
        name: "swapCallData",
      },
      {
        type: "bool",
        name: "unstake",
      },
    ],
  },
  [TEST_ADDRESS, TEST_ADDRESS, TEST_VALUE, TEST_ADDRESS, TEST_ADDRESS, TEST_VALUE, TEST_ADDRESS, "0x", true],
);

var multicall = new Contract(MULTICALLV3_ABI, MULTICALLV3_ADDRESS);

// ------------------------- examples -------------------------
//
// aggregates takes in a list of tuples
// tuple -> (address, calldata)

// deposit + stake
multicall.methods
  .aggregate([
    [VAULT_ADDRESS, depositEncoding],
    [VAULT_STAKING_ADDRESS, stakeEncoding],
  ])
  .call()
  .then(console.log);

// zapIn + stake
multicall.methods
  .aggregate([
    [VAULT_V1_ZAPPER_ADDRESS, zapInEncoding],
    [VAULT_STAKING_ADDRESS, stakeEncoding],
  ])
  .call()
  .then(console.log);

// unstake + zapOut
multicall.methods
  .aggregate([
    [VAULT_STAKING_ADDRESS, unstakeEncoding],
    [VAULT_V1_ZAPPER_ADDRESS, zapOutEncoding],
  ])
  .call()
  .then(console.log);

// deposit + stake
multicall.methods
  .aggregate([
    [VAULT_ADDRESS, depositEncoding],
    [VAULT_STAKING_ADDRESS, stakeEncoding],
  ])
  .call()
  .then(console.log);

// unstake + deposit
multicall.methods
  .aggregate([
    [VAULT_STAKING_ADDRESS, unstakeEncoding],
    [VAULT_ADDRESS, depositEncoding],
  ])
  .call()
  .then(console.log);
