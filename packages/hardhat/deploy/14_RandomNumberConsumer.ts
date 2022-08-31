import { DeployFunction } from "@anthonymartin/hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { getSignerFrom } from "../lib/utils/getSignerFrom";
import { addContractToRegistry } from "./utils";

const ADDR_CHAINLINK_VRF_COORDINATOR = "0xf0d54349addcf704f77ae15b96510dea15cb7952";
const ADDR_CHAINLINK_LINK_TOKEN = "0x514910771af9ca656af840dff83e8264ecf986ca";
const ADDR_CHAINLINK_KEY_HASH = "0xaa77729d3466ca35ae8d28b3bbac7cc36a5031efdc430821c02bc31a238af445";

const main: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const addresses = await getNamedAccounts();

  const signer = await getSignerFrom(hre.config.namedAccounts.deployer as string, hre);

  await deploy("RandomNumberConsumer", {
    from: addresses.deployer,
    args: [ADDR_CHAINLINK_VRF_COORDINATOR, ADDR_CHAINLINK_LINK_TOKEN, ADDR_CHAINLINK_KEY_HASH],
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
    contract: "RandomNumberConsumer",
  });
  await addContractToRegistry("RandomNumberConsumer", deployments, signer, hre);
};
export default main;
main.dependencies = ["setup", "contract-registry"];
main.tags = ["core", "random-number-consumer"];
