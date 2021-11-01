import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  await deploy("3CRV", {
    from: deployer,
    args: ["Three Curve", "3CRV"],
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
    contract: "MockERC20",
  });

  await deploy("yVault1", {
    from: deployer,
    args: ["Vault1", "yV1"],
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
    contract: "MockERC20",
  });

  await deploy("yVault2", {
    from: deployer,
    args: ["Vault2", "yV2"],
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
    contract: "MockERC20",
  });

  await deploy("crvLP1", {
    from: deployer,
    args: ["crvLP1", "crvLP1"],
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
    contract: "MockERC20",
  });

  await deploy("crvLP2", {
    from: deployer,
    args: ["crvLP2", "crvLP2"],
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
    contract: "MockERC20",
  });

  await deploy("CurveMetapool1", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
    contract: "CurveMetapool",
  });

  await deploy("CurveMetapool2", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
    contract: "CurveMetapool",
  });

  await deploy("CurveThreePool", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
    contract: "Curve3Pool",
  });

  await deploy("BasicIssuanceModule", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
    contract: "BasicIssuanceModule",
  });
};
export default func;
