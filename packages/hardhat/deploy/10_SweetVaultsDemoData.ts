import { parseEther } from "@ethersproject/units";
import { DeployFunction } from "@anthonymartin/hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { getVaultStakingPools } from "../lib/utils/getStakingPools";
import { FaucetController, getSetup } from "./utils";

const main: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deploy, deployments, addresses, signer } = await getSetup(hre);
  const vaultStakingPools = await getVaultStakingPools(hre.network.config.chainId, addresses, deployments);

  for (var i = 0; i < vaultStakingPools.length; i++) {
    if (["hardhat", "local", "remote_fork"].includes(hre.network.name)) {
      await deploy("Faucet", {
        from: await signer.getAddress(),
        args: [addresses.uniswapRouter],
        log: true,
        autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
        contract: "Faucet",
      });

      await createDemoSweetVaults(hre, signer, addresses, vaultStakingPools[i]);
    }
  }
};

export default main;
main.dependencies = ["setup", "test-tokens", "contract-registry", "acl-registry", "test-pop", "sweet-vaults"];
main.tags = ["frontend", "sweet-vaults-demo-data"];

async function createDemoSweetVaults(hre: HardhatRuntimeEnvironment, signer, addresses, poolInfo) {
  const deployer = await signer.getAddress();
  const makeDeposit = async () => {
    const vault = await hre.ethers.getContractAt(
      "Vault",
      (
        await hre.deployments.get("sEthSweetVault")
      ).address,
      signer
    );
    const underlyingToken = await hre.ethers.getContractAt("MockERC20", poolInfo.inputToken, signer);
    await underlyingToken.approve(vault.address, parseEther("10"));
    await vault.depositAndStake(parseEther("10"));
    console.log(await (await underlyingToken.balanceOf(deployer)).toString());
  };

  const faucet = await FaucetController(hre, signer);

  await Promise.all([
    faucet.sendDai(deployer, 1000),
    faucet.sendUsdc(deployer, 10),
    faucet.sendCrvSethLPTokens(deployer, 100),
  ]);

  await makeDeposit();
}
