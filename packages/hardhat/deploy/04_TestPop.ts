import { DeployFunction } from "@anthonymartin/hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { getSetup} from './utils';

const contract_name = "TestPop";
const main: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deploy, deployments, addresses, signer } = await getSetup(hre);

  const deployed = await deploy("TestPOP", {
    from: await signer.getAddress(),
    args: ["Popcorn", "POP", 18],
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
    contract: "MockERC20",
  });

};

module.exports = main;
export default main;
main.dependencies = ["setup"];
main.tags = ["LBP", "frontend", "test-pop"];
