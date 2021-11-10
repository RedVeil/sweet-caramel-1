import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import getNamedAccounts from "../lib/utils/getNamedAccounts";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  let signer;
  let deployer;

  if (["hardhat", "local"].includes(hre.network.name)) {
    signer = (await hre.ethers.getSigners())[0]; //Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
    deployer = signer.address;
  } else {
    signer = hre.askForSigner();
    deployer = `privateKey://${signer.privateKey}`;
  }

  console.log("network name", hre.network.name);
  hre.config.namedAccounts = {
    deployer: deployer,
    ...getNamedAccounts(),
  };
};

module.exports = func;
module.exports.tags = ["LBP", "CCA", "setup"];
