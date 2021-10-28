import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import getNamedAccounts from "../lib/utils/getNamedAccounts";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  let signer;
  let deployer;

  if (["hardhat", "local"].includes(hre.network.name)) {
    signer = (await hre.ethers.getSigners())[0];
    deployer = signer.address;
  } else {
    signer = hre.askForSigner();
    deployer = `privateKey://${signer.privateKey}`;
  }

  hre.config.namedAccounts = {
    deployer: deployer,
    ...getNamedAccounts(),
  };
};

module.exports = func;
module.exports.tags = ["LBP"];
