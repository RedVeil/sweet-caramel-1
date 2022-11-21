import { getNamedAccountsByChainId } from "@popcorn/hardhat/lib/utils/getNamedAccounts";
import { ChainId, PRC_PROVIDERS, RPC_URLS } from "@popcorn/utils";
import fs from "fs";
import path from "path";
import { NextApiRequest, NextApiResponse } from "next";

const { createWatcher } = require("@makerdao/multicall");
const { ethers } = require("ethers");
const axios = require("axios");

const POP_TOKEN = {
  mainnet: "0xd0cd466b34a24fcb2f87676278af2005ca8a78c4",
  polygon: "0xc5b57e9a1e7914fda753a88f24e5703e617ee50c",
  arbitrum: "0x68ead55c258d6fa5e46d67fc90f53211eab885be",
};
const TOKEN_MANAGER = "0x50a7c5a2aa566eb8aafc80ffc62e984bfece334f";

const multicallConfig = {
  mainnet: {
    rpcUrl: `wss://mainnet.infura.io/ws/v3/${process.env.INFURA_PROJECT_ID}`,
    multicallAddress: "0xeefba1e63905ef1d7acba5a8513c70307c1ce441",
  },
  polygon: {
    rpcUrl: `wss://polygon-mainnet.infura.io/ws/v3/${process.env.INFURA_PROJECT_ID}`,
    multicallAddress: "0x11ce4B23bD875D7F5C6a31084f55fDe1e9A87507",
  },
};

const { popStaking, rewardsEscrow, rewardsDistribution, daoTreasury, daoAgentV2, tokenManager, popUsdcUniV3Pool } =
  getNamedAccountsByChainId(1);

const airdropAddress = "0x58db57f59dfeb70d69b9b448ff50d89b3c0a2c5f";
const popstarsAddress = "0xa57d3ab52b6880bc74c0ce1ae14919b1e709c260";
const partnersAdvisors = "0x50c8194cad3c7b19b0d220385c51e70024f63543";
const devFunds = "0x0ec6290abb4714ba5f1371647894ce53c6dd673a";

enum balanceMethod {
  spendableBalanceOf,
  balanceOf,
}

const balancesToExcludeFromMainnet = [
  { address: popStaking, contractName: "PopStaking" },
  { address: rewardsEscrow, contractName: "RewardsEscrow" },
  { address: rewardsDistribution, contractName: "RewardsDistribution" },
  { address: daoTreasury, contractName: "DaoTreasury" },
  { address: daoAgentV2, contractName: "DaoAgentV2" },
  { address: tokenManager, contractName: "TokenManager" },
  { address: popUsdcUniV3Pool, contractName: "PopUsdcUniV3Pool" },
  { address: airdropAddress, contractName: "AirdropAddress" },
  { address: popstarsAddress, contractName: "PopstarsAddress" },
  { address: partnersAdvisors, contractName: "PartnersAdvisors" },
  { address: devFunds, contractName: "DevFunds" },
];
const mainnetProvider = PRC_PROVIDERS[ChainId.Ethereum];
const binanceProvider = PRC_PROVIDERS[ChainId.BNB];
const arbitrumProvider = PRC_PROVIDERS[ChainId.Arbitrum];

async function main() {
  const mainnetAddressesWithPopMinusExcludableContracts =
    await getAllMainnetAddressesThatHaveInteractedWithPopThatArentExcludableContracts();

  const { totalMainnetBalance, mainnetBalances } = await multicallEthereumMainnetBalances(
    mainnetAddressesWithPopMinusExcludableContracts,
  );

  const excludableMainnetReport = await getExcludableMainnetBalances();

  const { arbitrumBalance, arbitrumAddressesObject, polygonBalance, polygonAddressesObject } =
    await getPolygonAndArbitrumBalancesToSubtract();

  const { binanceAddressesObject, binanceBalance } = await getBinanceExclusionsAndBalances();

  const finaCirculatingSupply = totalMainnetBalance - (arbitrumBalance + polygonBalance + binanceBalance);
  console.log("FINAL CIRCULATING SUPPLY: ", finaCirculatingSupply);

  await exportToCSV(
    excludableMainnetReport,
    mainnetBalances,
    polygonAddressesObject,
    arbitrumAddressesObject,
    binanceAddressesObject,
  );

  return {
    finaCirculatingSupply,
    polygonAddressesObject,
    arbitrumAddressesObject,
    excludableMainnetReport,
    binanceAddressesObject,
    mainnetBalances,
  };
}

async function getAllMainnetLogsFromContract(blockNumber) {
  let pageNumber = 0;
  let tempResult = { resultsArray: [], length: 1000 };

  while (tempResult.length === 1000) {
    pageNumber = pageNumber + 1;
    tempResult = await loopOverEtherscan(pageNumber, tempResult, blockNumber);
  }
  pageNumber = pageNumber + 1;
  tempResult = await loopOverEtherscan(pageNumber, tempResult, blockNumber);

  return tempResult;
}

async function loopOverEtherscan(pageNumber, results, blockNumber) {
  const etherscanApiUrl = `https://api.etherscan.io/api?module=logs&action=getLogs&address=${POP_TOKEN.mainnet}&fromBlock=1&toBlock=${blockNumber}&page=${pageNumber}&offset=1000&apikey=${process.env.ETHERSCAN_API_KEY}`;
  const etherscanData = await axios.get(etherscanApiUrl);
  if (etherscanData && etherscanData.data.message === "OK") {
    let newArray = results.resultsArray.concat(etherscanData.data.result);
    return { resultsArray: newArray, length: etherscanData.data.result.length };
  } else {
    return results;
  }
}

async function getExcludableMainnetBalances() {
  const spendableBalanceOfArray = balancesToExcludeFromMainnet.map((contract) => ({
    target: TOKEN_MANAGER,
    call: ["spendableBalanceOf(address)(uint256)", contract.address],
    returns: [
      [
        JSON.stringify({
          address: contract.address,
          contractName: contract.contractName,
          method: balanceMethod.spendableBalanceOf,
        }),
        (val) => val / 10 ** 18,
      ],
    ],
  }));

  const balanceOfArray = balancesToExcludeFromMainnet.map((contract) => ({
    target: POP_TOKEN.mainnet,
    call: ["balanceOf(address)(uint256)", contract.address],
    returns: [
      [
        JSON.stringify({
          address: contract.address,
          contractName: contract.contractName,
          method: balanceMethod.balanceOf,
        }),
        (val) => val / 10 ** 18,
      ],
    ],
  }));

  const multiCallArray = spendableBalanceOfArray.concat(balanceOfArray);

  const watcher = createWatcher(multiCallArray, multicallConfig.mainnet);

  let excludableMainnetReport = {};

  watcher.subscribe((update) => {
    const parsed = JSON.parse(update.type);
    excludableMainnetReport = {
      ...excludableMainnetReport,
      [parsed.address]: {
        ...excludableMainnetReport[parsed.address],
        contractName: parsed.contractName,
        [parsed.method === balanceMethod.spendableBalanceOf ? "spendableBalanceOf" : "balanceOf"]: update.value,
      },
    };
  });

  watcher.start();
  await watcher.awaitInitialFetch();
  console.log("Initial fetch completed");
  return excludableMainnetReport;
}

async function getAllMainnetAddressesThatHaveInteractedWithPopThatArentExcludableContracts() {
  const currentBlockNumber = await mainnetProvider.getBlockNumber();
  const allTransactionsEtherscan = await getAllMainnetLogsFromContract(currentBlockNumber);
  let addresses = [];

  for (let k = 0; k < allTransactionsEtherscan.resultsArray.length; k++) {
    // get all addresses involved in POP transaction logs
    addresses.push(
      `0x${allTransactionsEtherscan.resultsArray[k].topics[1].slice(26)}`,
      `0x${allTransactionsEtherscan.resultsArray[k].topics[2].slice(26)}`,
    );
  }
  const lowercasedAddresses = addresses.map((addr) => addr.toLowerCase());
  const uniqueAddresses = [...new Set(lowercasedAddresses)];
  const listOflowerCaseExlusionaryContracts = balancesToExcludeFromMainnet.map((contr) => contr.address.toLowerCase());
  const excludeMainnetAddresses = uniqueAddresses.filter(
    (address) => !listOflowerCaseExlusionaryContracts.includes(address),
  );

  return excludeMainnetAddresses;
}

async function multicallEthereumMainnetBalances(addressArray) {
  const spendableBalanceOfArray = addressArray.map((address) => ({
    target: TOKEN_MANAGER,
    call: ["spendableBalanceOf(address)(uint256)", address],
    returns: [[JSON.stringify({ address, method: balanceMethod.spendableBalanceOf }), (val) => val / 10 ** 18]],
  }));
  const balanceOfArray = addressArray.map((address) => ({
    target: POP_TOKEN.mainnet,
    call: ["balanceOf(address)(uint256)", address],
    returns: [[JSON.stringify({ address, method: balanceMethod.balanceOf }), (val) => val / 10 ** 18]],
  }));

  let totalMainnetBalance = 0;
  let mainnetBalances = {};

  const multiCallArray = spendableBalanceOfArray.concat(balanceOfArray);

  const watcher = createWatcher(multiCallArray, multicallConfig.mainnet);

  watcher.subscribe((update) => {
    const parsed = JSON.parse(update.type);
    if (parsed.method === balanceMethod.spendableBalanceOf) {
      totalMainnetBalance += update.value;
    }
    mainnetBalances[parsed.address] = {
      ...mainnetBalances[parsed.address],
      [parsed.method === balanceMethod.spendableBalanceOf ? "spendableBalanceOf" : "balanceOf"]: update.value,
    };
  });

  watcher.start();
  await watcher.awaitInitialFetch();
  console.log("Initial fetch completed");

  console.log("total Mainnet balance with exclusions applied", totalMainnetBalance);
  watcher.stop();

  return { totalMainnetBalance, mainnetBalances };
}

async function getPolygonAndArbitrumBalancesToSubtract() {
  const { popStaking, rewardsEscrow, rewardsDistribution, daoTreasury, xPopRedemption, pop } =
    getNamedAccountsByChainId(137);
  const addresses = [
    { address: popStaking, contractName: "popStaking" },
    { address: rewardsEscrow, contractName: "rewardsEscrow" },
    { address: rewardsDistribution, contractName: "rewardsDistribution" },
    { address: daoTreasury, contractName: "daoTreasury" },
    { address: xPopRedemption, contractName: "xPopRedemption" },
  ];
  const multiCallArray = addresses.map((contract) => ({
    target: pop,
    call: ["balanceOf(address)(uint256)", contract.address],
    returns: [
      [JSON.stringify({ contractName: contract.contractName, address: contract.address }), (val) => val / 10 ** 18],
    ],
  }));

  const watcher = createWatcher(multiCallArray, multicallConfig.polygon);
  let polygonBalance = 0;
  let polygonAddressesObject = {};

  watcher.subscribe((update) => {
    const parsed = JSON.parse(update.type);
    polygonAddressesObject[parsed.address] = {
      ...polygonAddressesObject[parsed.address],
      contractName: parsed.contractName,
      spendableBalanceOf: update.value,
      balanceOf: update.value,
    };
    polygonBalance += update.value;
  });

  watcher.start();
  await watcher.awaitInitialFetch();
  console.log(polygonBalance, "polygonBalanceToSubtract");

  let arbitrumBalanceToSubtract = ethers.constants.Zero;
  let arbitrumAddressesObject = {};

  const {
    popStaking: popStakingArbitrum,
    rewardsEscrow: rewardsEscrowArbitrum,
    daoTreasury: daoTreasuryArbitrum,
    xPopRedemption: xPopRedemptionArbitrum,
    pop: popArbitrum,
  } = getNamedAccountsByChainId(42161);

  const arbitrumAddresses = [
    { address: popStakingArbitrum, contractName: "popStakingArbitrum" },
    { address: rewardsEscrowArbitrum, contractName: "rewardsEscrowArbitrum" },
    { address: daoTreasuryArbitrum, contractName: "daoTreasuryArbitrum" },
    { address: xPopRedemptionArbitrum, contractName: "xPopRedemptionArbitrum" },
  ];

  const popArbitrumContract = new ethers.Contract(popArbitrum, require("@popcorn/app/abis/ERC20"), arbitrumProvider);
  for (let j = 0; j < arbitrumAddresses.length; j++) {
    const thisBalance = await popArbitrumContract.balanceOf(arbitrumAddresses[j].address);
    const realNumberBalance = Number(ethers.utils.formatEther(thisBalance));
    arbitrumAddressesObject[arbitrumAddresses[j].address] = {
      contractName: arbitrumAddresses[j].contractName,
      balanceOf: realNumberBalance,
      spendableBalanceOf: realNumberBalance,
    };
    arbitrumBalanceToSubtract = arbitrumBalanceToSubtract.add(thisBalance);
  }

  const arbitrumBalance = Number(ethers.utils.formatEther(arbitrumBalanceToSubtract));
  console.log("arbitrum balance to subtract", arbitrumBalance);
  watcher.stop();

  return { arbitrumBalance, polygonBalance, arbitrumAddressesObject, polygonAddressesObject };
}

async function getBinanceExclusionsAndBalances() {
  let binanceBalanceToSubtract = ethers.constants.Zero;
  let binanceAddressesObject = {};

  const {
    rewardsEscrow: rewardsEscrowBinance,
    xPopRedemption: xPopRedemptionBinance,
    pop: popBinance,
  } = getNamedAccountsByChainId(56);
  const binanceAddresses = [
    { address: rewardsEscrowBinance, contractName: "rewardsEscrowBinance" },
    { address: xPopRedemptionBinance, contractName: "xPopRedemptionBinance" },
  ];

  const popBinanceContract = new ethers.Contract(popBinance, require("@popcorn/app/abis/ERC20"), binanceProvider);
  for (let j = 0; j < binanceAddresses.length; j++) {
    const thisBalance = await popBinanceContract.balanceOf(binanceAddresses[j].address);
    const realNumberBalance = Number(ethers.utils.formatEther(thisBalance));
    binanceAddressesObject[binanceAddresses[j].address] = {
      contractName: binanceAddresses[j].contractName,
      balanceOf: realNumberBalance,
      spendableBalanceOf: realNumberBalance,
    };
    binanceBalanceToSubtract = binanceBalanceToSubtract.add(thisBalance);
  }

  const binanceBalance = Number(ethers.utils.formatEther(binanceBalanceToSubtract));
  console.log("binance balance to subtract", binanceBalance);

  return { binanceBalance, binanceAddressesObject };
}

async function exportToCSV(
  mainnetAddressesToExclude,
  mainnetBalances,
  polygonAddressesToExclude,
  arbitrumAddressesToExclude,
  binanceAddressesToExclude,
) {
  const columns = ['"address"', '"name"', '"balance"', '"spendable"', '"excludableBalance"', '"chain"'];

  const mainnetExclusions = Object.keys(mainnetAddressesToExclude).map((address) => [
    address,
    mainnetAddressesToExclude[address].contractName,
    mainnetAddressesToExclude[address].balanceOf,
    mainnetAddressesToExclude[address].spendableBalanceOf,
    mainnetAddressesToExclude[address].balanceOf,
    "mainnet",
  ]);
  const polygonExclusions = Object.keys(polygonAddressesToExclude).map((address) => [
    address,
    polygonAddressesToExclude[address].contractName,
    polygonAddressesToExclude[address].balanceOf,
    polygonAddressesToExclude[address].spendableBalanceOf,
    polygonAddressesToExclude[address].balanceOf,
    "polygon",
  ]);
  const arbitrumExclusions = Object.keys(arbitrumAddressesToExclude).map((address) => [
    address,
    arbitrumAddressesToExclude[address].contractName,
    arbitrumAddressesToExclude[address].balanceOf,
    arbitrumAddressesToExclude[address].spendableBalanceOf,
    arbitrumAddressesToExclude[address].balanceOf,
    "arbitrum",
  ]);
  const binanceExclusions = Object.keys(binanceAddressesToExclude).map((address) => [
    address,
    binanceAddressesToExclude[address].contractName,
    binanceAddressesToExclude[address].balanceOf,
    binanceAddressesToExclude[address].spendableBalanceOf,
    binanceAddressesToExclude[address].balanceOf,
    "binance",
  ]);
  const mainnetArray = Object.keys(mainnetBalances).map((address) => [
    address,
    mainnetBalances[address].contractName,
    mainnetBalances[address].balanceOf,
    mainnetBalances[address].spendableBalanceOf,
    "",
    "mainnet",
  ]);

  const mergeArray = [
    ...mainnetExclusions,
    ...polygonExclusions,
    ...arbitrumExclusions,
    ...binanceExclusions,
    ...mainnetArray,
  ];

  const fileName = `popx.csv`;
  const filePath = path.join(process.cwd(), "public/images", fileName);

  const finalArray = [columns].concat(mergeArray);
  console.log(finalArray);

  try {
    const writeStream = fs.createWriteStream(filePath);

    console.info(`Writing data to file ${filePath}...`);
    await finalArray.reduce(async (promise: any, line) => {
      await promise;
      return writeStream.write(`${line}\n`, "utf8", (err) => {
        if (err) console.error(err);
        return Promise.resolve();
      });
    }, Promise.resolve());

    await writeStream.end();
    console.info(`Closed file ${filePath}...`);
  } catch (ex) {
    console.error(ex);
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  let data;
  try {
    data = await main();
  } catch (err) {
    return res.status(400).send({ error: err });
  }

  res.setHeader("Cache-Control", "s-maxage=43200");
  return res.json({ success: true, permitted: data });
}
