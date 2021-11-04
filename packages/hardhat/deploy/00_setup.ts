import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import getNamedAccounts from "../lib/utils/getNamedAccounts";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const signer = hre.askForSigner();

  hre.config.namedAccounts = {
    deployer: `privateKey://${signer.privateKey}`,
    ...getNamedAccounts(),
  };
};

module.exports = func;
module.exports.tags = ["LBP", "CCA"];
