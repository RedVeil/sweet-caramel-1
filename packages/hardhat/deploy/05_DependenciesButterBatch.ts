import { parseEther } from "@ethersproject/units";
import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { getSignerFrom } from "../lib/utils/getSignerFrom";
import { MockERC20 } from "../typechain";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  const signer = getSignerFrom(
    hre.config.namedAccounts.deployer as string,
    hre
  );

  await deploy("3CRV", {
    from: deployer,
    args: ["Three Curve", "3CRV", 18],
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
    contract: "MockERC20",
  });

  await deploy("yVault1", {
    from: deployer,
    args: ["Vault1", "yV1", 18],
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
    contract: "MockERC20",
  });

  await deploy("yVault2", {
    from: deployer,
    args: ["Vault2", "yV2", 18],
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
    contract: "MockERC20",
  });

  await deploy("crvLP1", {
    from: deployer,
    args: ["crvLP1", "crvLP1", 18],
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
    contract: "MockERC20",
  });

  await deploy("crvLP2", {
    from: deployer,
    args: ["crvLP2", "crvLP2", 18],
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
    contract: "MockERC20",
  });

  // await deploy("CurveMetapool1", {
  //   from: deployer,
  //   args: [],
  //   log: true,
  //   autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
  //   contract: "CurveMetapool",
  // });

  // await deploy("CurveMetapool2", {
  //   from: deployer,
  //   args: [],
  //   log: true,
  //   autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
  //   contract: "CurveMetapool",
  // });

  // await deploy("CurveThreePool", {
  //   from: deployer,
  //   args: [],
  //   log: true,
  //   autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
  //   contract: "Curve3Pool",
  // });

  // await deploy("BasicIssuanceModule", {
  //   from: deployer,
  //   args: [],
  //   log: true,
  //   autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
  //   contract: "BasicIssuanceModule",
  // });

  await connectAndMintToken(
    (
      await deployments.get("3CRV")
    ).address,
    signer,
    hre
  );
  await connectAndMintToken(
    (
      await deployments.get("BUTTER")
    ).address,
    signer,
    hre
  );
};
export default func;

async function connectAndMintToken(
  tokenAddress: string,
  signer: any,
  hre: HardhatRuntimeEnvironment
): Promise<MockERC20> {
  const token = await hre.ethers.getContractAt(
    "MockERC20",
    tokenAddress,
    signer
  );
  await (
    await token.mint(await signer.getAddress(), parseEther("1000000000"))
  ).wait(1);
  return token;
}
