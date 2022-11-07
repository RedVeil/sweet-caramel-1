import { DeployFunction } from "@anthonymartin/hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { addContractToRegistry, getSetup } from "./utils";

const main: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deploy, deployments, addresses, signer } = await getSetup(hre);

  await deploy("VaultsV1Factory", {
    from: await signer.getAddress(),
    args: [await signer.getAddress()], // deployer will initially be owner for Owned
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
    contract: "VaultsV1Factory",
  });
  console.log("adding VaultsV1Factory to contract registry...");
  await addContractToRegistry("VaultsV1Factory", deployments, signer, hre);
};
export default main;
main.dependencies = ["setup", "contract-registry"];
main.tags = ["core", "vault", "vaults-v1-factory"];
