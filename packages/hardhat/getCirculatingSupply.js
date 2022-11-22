const { createWatcher } = require("@makerdao/multicall");
const { ethers } = require("ethers");
const axios = require("axios");
const {
  getNamedAccountsByChainId,
} = require("./lib/utils/getNamedAccounts.ts");

const POP_TOKEN = {
  mainnet: "0xd0cd466b34a24fcb2f87676278af2005ca8a78c4",
  polygon: "0xc5b57e9a1e7914fda753a88f24e5703e617ee50c",
  arbitrum: "0x68ead55c258d6fa5e46d67fc90f53211eab885be",
};
const TOKEN_MANAGER = "0x50a7c5a2aa566eb8aafc80ffc62e984bfece334f";
const etherscanAPIKey = "Z57KPGIPH2G3KH2BR95HEUD89WJGN3EAJU";
const networkInformation = {
  mainnet: {
    RPC_URL:
      "https://eth-mainnet.g.alchemy.com/v2/HR-TkdGLPoQasZbWeBTsWDjC95uP4X5e",
  },
  polygon: {
    RPC_URL: `https://polygon-mainnet.g.alchemy.com/v2/1lZOXEzuKPOAhLY6JGM4SyN8iFMG8yuR`,
  },
  arbitrum: {
    RPC_URL:
      "https://arb-mainnet.g.alchemy.com/v2/JNRc7rA2DP6xB1p_8k6cn0Pun2jn7nvu",
  },
};
const multicallConfig = {
  mainnet: {
    rpcUrl: "wss://mainnet.infura.io/ws/v3/5c244fcd48af4896ab389b3e8063ea56",
    multicallAddress: "0xeefba1e63905ef1d7acba5a8513c70307c1ce441",
  },
  polygon: {
    rpcUrl:
      "wss://polygon-mainnet.g.alchemy.com/v2/1lZOXEzuKPOAhLY6JGM4SyN8iFMG8yuR",
    multicallAddress: "0x11ce4B23bD875D7F5C6a31084f55fDe1e9A87507",
  },
  arbitrum: {
    rpcUrl: "wss://mainnet.infura.io/ws/v3/5c244fcd48af4896ab389b3e8063ea56",
    multicallAddress: "0xeefba1e63905ef1d7acba5a8513c70307c1ce441",
  },
};

const {
  popStaking,
  rewardsEscrow,
  rewardsDistribution,
  daoTreasury,
  daoAgent,
  daoAgentV2,
  tokenManager,
  popUsdcUniV3Pool,
} = getNamedAccountsByChainId(1);

const airdropAddress = "0x58db57f59dfeb70d69b9b448ff50d89b3c0a2c5f";
const popstarsAddress = "0xa57d3ab52b6880bc74c0ce1ae14919b1e709c260";
const partnersAdvisors = "0x50c8194cad3c7b19b0d220385c51e70024f63543";
const devFunds = "0x0ec6290abb4714ba5f1371647894ce53c6dd673a";

const balancesToExcludeFromMainnet = [
  popStaking,
  rewardsEscrow,
  rewardsDistribution,
  daoTreasury,
  daoAgent,
  daoAgentV2,
  tokenManager,
  popUsdcUniV3Pool,
  airdropAddress,
  popstarsAddress,
  partnersAdvisors,
  devFunds,
];

async function main() {
  const mainnetProvider = new ethers.providers.JsonRpcProvider(
    networkInformation.mainnet.RPC_URL
  );
  const currentBlockNumber = await mainnetProvider.getBlockNumber();
  const allTransactionsEtherscan = await getAllMainnetLogsFromContract(
    currentBlockNumber
  );
  let addresses = [];
  for (let k = 0; k < allTransactionsEtherscan.resultsArray.length; k++) {
    // get all addresses involved in POP transaction logs
    addresses.push(
      `0x${allTransactionsEtherscan.resultsArray[k].topics[1].slice(26)}`,
      `0x${allTransactionsEtherscan.resultsArray[k].topics[2].slice(26)}`
    );
  }

  const uniqueAddresses = [...new Set(addresses)];

  const excludeMainnetAddresses = uniqueAddresses.filter(
    (address) => !balancesToExcludeFromMainnet.includes(address)
  );

  // MULTICALL
  const multiCallArray = excludeMainnetAddresses.map((address) => ({
    target: TOKEN_MANAGER,
    call: ["spendableBalanceOf(address)(uint256)", address],
    returns: [[`spendableBalanceOf ${address}: `, (val) => val / 10 ** 18]],
  }));
  let totalMainnetBalance = 0;

  const watcher = createWatcher(multiCallArray, multicallConfig.mainnet);

  watcher.subscribe((update) => {
    console.log(`Update: ${update.type} = ${update.value}`);
    totalMainnetBalance += update.value;
  });

  watcher.start();
  await watcher.awaitInitialFetch();
  console.log("Initial fetch completed");

  console.log(
    "total Mainnet balance with exclusions applied",
    totalMainnetBalance
  );

  const { arbitrumBalanceRealNumber, polygonBalanceToSubtract } =
    await getPolygonAndArbitrumBalancesToSubtract();

  const finaCirculatingSupply =
    totalMainnetBalance -
    (arbitrumBalanceRealNumber + polygonBalanceToSubtract);

  console.log("FINAL CIRCULATING SUPPLY: ", finaCirculatingSupply);

  return finaCirculatingSupply;
}

async function getAllMainnetLogsFromContract(blockNumber) {
  let pageNumber = 0;
  let tempResult = { resultsArray: [], length: 1000 };

  for (let j = 0; j < 1000; j++) {
    console.log(j, "j");
    pageNumber = pageNumber + 1;
    if (tempResult.length !== 1000) {
      tempResult = await loopOverEtherscan(pageNumber, tempResult, blockNumber);
      break;
    } else {
      tempResult = await loopOverEtherscan(pageNumber, tempResult, blockNumber);
      continue;
    }
  }

  return tempResult;
}

async function loopOverEtherscan(pageNumber, results, blockNumber) {
  const etherscanApiUrl = `https://api.etherscan.io/api?module=logs&action=getLogs&address=${POP_TOKEN.mainnet}&fromBlock=1&toBlock=${blockNumber}&page=${pageNumber}&offset=1000&apikey=${etherscanAPIKey}`;
  const etherscanData = await axios.get(etherscanApiUrl);
  if (etherscanData && etherscanData.data.message === "OK") {
    let newArray = results.resultsArray.concat(etherscanData.data.result);
    return { resultsArray: newArray, length: etherscanData.data.result.length };
  } else {
    return results;
  }
}

async function getPolygonAndArbitrumBalancesToSubtract() {
  const {
    popStaking,
    rewardsEscrow,
    rewardsDistribution,
    daoTreasury,
    xPopRedemption,
    pop,
  } = getNamedAccountsByChainId(137);
  const addresses = [
    popStaking,
    rewardsEscrow,
    rewardsDistribution,
    daoTreasury,
    xPopRedemption,
  ];
  const multiCallArray = addresses.map((k) => ({
    target: pop,
    call: ["balanceOf(address)(uint256)", k],
    returns: [[`balanceOf ${k}: `, (val) => val / 10 ** 18]],
  }));

  const watcher = createWatcher(multiCallArray, multicallConfig.polygon);

  let polygonBalanceToSubtract = 0;

  watcher.subscribe((update) => {
    console.log(`Update: ${update.type} = ${update.value}`);
    polygonBalanceToSubtract += update.value;
  });

  watcher.start();

  await watcher.awaitInitialFetch();
  console.log(polygonBalanceToSubtract, "polygonBalanceToSubtract");

  let arbitrumBalanceToSubtract = ethers.constants.Zero;

  const {
    popStaking: popStakingArbitrum,
    rewardsEscrow: rewardsEscrowArbitrum,
    daoTreasury: daoTreasuryArbitrum,
    xPopRedemption: xPopRedemptionArbitrum,
    pop: popArbitrum,
  } = getNamedAccountsByChainId(42161);
  const arbitrumAddresses = [
    popStakingArbitrum,
    rewardsEscrowArbitrum,
    daoTreasuryArbitrum,
    xPopRedemptionArbitrum,
  ];
  const arbitrumProvider = new ethers.providers.JsonRpcProvider(
    networkInformation.arbitrum.RPC_URL
  );
  const popArbitrumContract = new ethers.Contract(
    popArbitrum,
    require("@popcorn/app/abis/ERC20"),
    arbitrumProvider
  );
  for (let j = 0; j < arbitrumAddresses.length; j++) {
    const thisBalance = await popArbitrumContract.balanceOf(
      arbitrumAddresses[j]
    );
    arbitrumBalanceToSubtract = arbitrumBalanceToSubtract.add(thisBalance);
  }

  const arbitrumBalanceRealNumber = Number(
    ethers.utils.formatEther(arbitrumBalanceToSubtract)
  );
  console.log("arbitrum balance to subtract", arbitrumBalanceRealNumber);

  return { arbitrumBalanceRealNumber, polygonBalanceToSubtract };
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
