const fs = require("fs");

const hardhatDeployedContractsJson = require("./deployments.json");
const mainnetNamedAccounts = require("./lib/utils/namedAccounts.json");
const contractsCopiedAndInitializedWithMainnetAddress = Object.keys(
  mainnetNamedAccounts
).reduce((object, contract) => {
  return {
    ...object,
    [contract]: {
      ...mainnetNamedAccounts[contract],
      hardhat: mainnetNamedAccounts[contract].mainnet,
    },
  };
}, {});

const mappingOfHardhatContractNamesToOurName = {
  PopLocker: "popStaking",
  butterStaking: "butterStaking",
  threeXStaking: "threeXStaking",
  ButterWhaleProcessing: "butterWhaleProcessing",
  TestPOP: "pop",
  XPop: "xPop",
  xPopRedemption: "xPopRedemption",
  ThreeXBatchProcessing: "threeXBatch",
  ThreeXWhaleProcessing: "threeXWhale",
  ThreeXBatchVault: "threeXBatchVault",
  ThreeXZapper: "threeXZapper",
  ACLRegistry: "aclRegistry",
  KeeperIncentive: "keeperIncentive",
  ContractRegistry: "contractRegistry",
  ButterBatchProcessing: "butterBatch",
  ButterBatchZapper: "butterBatchZapper",
  RewardsEscrow: "rewardsEscrow",
  RewardsDistribution: "rewardsDistribution",
  BeneficiaryRegistry: "beneficiaryRegistry",
  BeneficiaryGovernance: "beneficiaryGovernance",
  GrantElections: "grantElections",
  RewardsManager: "rewardsManager",
  GovStaking: "govStaking",
  ZeroXZapper: "zeroXZapper",
  Faucet: "faucet",
  VaultsV1Zapper: "vaultsV1Zapper",
  VaultsV1Controller: "vaultsV1Controller",
  VaultsV1Factory: "vaultsV1Factory",
  VaultsV1Registry: "vaultsV1registry",
};

function overwriteHardhatAddresses() {
  const hardhatContracts = hardhatDeployedContractsJson.contracts;
  const arrayOfContractNamesFromHardhat = Object.keys(
    hardhatDeployedContractsJson.contracts
  );

  const updatedNamedAccountsObject = arrayOfContractNamesFromHardhat.reduce(
    (object, hardhatContractName) => {
      const frontendReadableName =
        mappingOfHardhatContractNamesToOurName[hardhatContractName];
      object[frontendReadableName || hardhatContractName] = {
        ...object[frontendReadableName],
        hardhat: hardhatContracts[hardhatContractName].address,
      };
      return object;
    },
    contractsCopiedAndInitializedWithMainnetAddress
  );

  const fileName = "./lib/utils/namedAccounts.json";

  fs.writeFile(
    fileName,
    JSON.stringify(updatedNamedAccountsObject, null, 2),
    function writeJSON(err) {
      if (err) return console.log(err);
      console.log(JSON.stringify(updatedNamedAccountsObject));
      console.log("writing to " + fileName);
    }
  );
}

overwriteHardhatAddresses();
