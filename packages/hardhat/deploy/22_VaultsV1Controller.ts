import { DeployFunction } from "@anthonymartin/hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { getSignerFrom } from "../lib/utils/getSignerFrom";
import { addContractToRegistry } from "./utils";

const main: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const addresses = await getNamedAccounts();

  const signer = await getSignerFrom(hre.config.namedAccounts.deployer as string, hre);

  const vaultsV1RegistryAddress = (await deployments.get("VaultsV1Registry")).address;
  const vaultsV1FactoryAddress = (await deployments.get("VaultsV1Factory")).address;
  // ContractRegistry
  const contractRegistryAddress = (await deployments.get("ContractRegistry")).address;

  await deploy("VaultsV1Controller", {
    from: addresses.deployer,
    args: [addresses.deployer, contractRegistryAddress], // deployer will be owner for Owned
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
    contract: "VaultsV1Controller",
  });
  console.log("adding VaultsV1Controller to contract registry...");
  await addContractToRegistry("VaultsV1Controller", deployments, signer, hre);

  const vaultsV1ControllerAddress = (await deployments.get("VaultsV1Controller")).address;
  const vaultsV1Controller = await hre.ethers.getContractAt("VaultsV1Controller", vaultsV1ControllerAddress);

  console.log("transfering VaultRegistry and VaultsV1Factory ownership to controller ... ");
  const vaultRegistry = await hre.ethers.getContractAt("VaultsV1Registry", vaultsV1RegistryAddress);
  const registryNominateTx = await vaultRegistry.nominateNewOwner(vaultsV1ControllerAddress);
  await registryNominateTx.wait();
  const vaultsV1Factory = await hre.ethers.getContractAt("VaultsV1Factory", vaultsV1FactoryAddress);
  const factoryNominateTx = await vaultsV1Factory.nominateNewOwner(vaultsV1ControllerAddress);
  await factoryNominateTx.wait();
  const ownershipTransferTx = await vaultsV1Controller.acceptRegistryFactoryOwnership();
  await ownershipTransferTx.wait(1);
  console.log("VaultsV1Registry and VaultsV1Factory ownership sucessfully transferred to VaultsV1Controller");
};
export default main;
main.dependencies = ["setup"];
main.tags = ["core", "vault", "vaults-v1-controller"];
