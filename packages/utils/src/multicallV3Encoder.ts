const Web3 = require("web3");
var Contract = require("web3-eth-contract");

let web3 = new Web3(process.env.RPC_URL);

const TEST_VALUE = "65535";

/**
 * first address -> Vault.sol
 * second address -> VaultStaking.sol
 */
const EXAMPLE_ADDRESSES = ["0x6887246668a3b87F54DeB3b94Ba47a6f63F32985", "0xa4b1E63Cb4901E327597bc35d36FE8a23e4C253f"];

// on every network the same
const MULTICALLV3_ADDRESS = "0xcA11bde05977b3631167028862bE2a173976CA11";

// we only need the aggregate fn for now
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

var multicall = new Contract(MULTICALLV3_ABI, MULTICALLV3_ADDRESS);

/**
 * aggregates takes in a list of tuples
 * tuple -> (address, calldata)
 */
multicall.methods
  .aggregate([
    [EXAMPLE_ADDRESSES[0], depositEncoding],
    [EXAMPLE_ADDRESSES[1], stakeEncoding],
  ])
  .call()
  .then(console.log);
