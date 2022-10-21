const Web3 = require("web3");

const TEST_VALUE = "65535";

let web3 = new Web3("https://goerli.infura.io/v3/86deaa6b3a2c4b19805ff8ac9051d403");

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

console.log(depositEncoding);
console.log(stakeEncoding);
