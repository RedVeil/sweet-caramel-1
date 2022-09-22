import { parseEther } from "@ethersproject/units";
import { BigNumber } from "@ethersproject/bignumber";

import { DeployFunction } from "@anthonymartin/hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { getSignerFrom } from "../lib/utils/getSignerFrom";
import { getVaultStakingPools } from "../lib/utils/getStakingPools";
import { FaucetController } from "./utils";

const initalDepositAmount = {
  "eCRV": parseEther("10"), // sETH/ETH
  "crv3crypto": parseEther("1"),
  "USDT": BigNumber.from("1000000000")
}

const main: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const addresses = await getNamedAccounts();
  const signer = await getSignerFrom(hre.config.namedAccounts.deployer as string, hre);
  const vaultStakingPools = await getVaultStakingPools(hre.network.config.chainId, addresses, deployments);

  if (["hardhat", "local"].includes(hre.network.name)) {
    await deploy("Faucet", {
      from: addresses.deployer,
      args: [addresses.uniswapRouter],
      log: true,
      autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
      contract: "Faucet",
    });
    await fundAccount(hre, signer, addresses)
    for (var i = 0; i < vaultStakingPools.length; i++) {
      await createDemoSweetVaults(hre, signer, addresses, vaultStakingPools[i]);
    }
  }
};

export default main;
main.dependencies = ["setup", "test-tokens", "contract-registry", "acl-registry", "test-pop", "sweet-vaults"];
main.tags = ["frontend", "sweet-vaults-demo-data"];

async function fundAccount(hre, signer, addresses) {
  const { deployer } = addresses;
  const faucet = await FaucetController(hre, signer);

  await Promise.all([
    faucet.sendDai(deployer, 10),
    faucet.sendUsdc(deployer, 10),
    faucet.sendUsdt(deployer, 10),
    faucet.sendCrv3CryptoLPTokens(deployer, 100),
    faucet.sendCrvSethLPTokens(addresses.deployer, 100),
  ]);
}

async function createDemoSweetVaults(hre: HardhatRuntimeEnvironment, signer, addresses, poolInfo) {
  const makeDeposit = async () => {
    const vault = await hre.ethers.getContractAt(
      "Vault",
      (
        await hre.deployments.get(poolInfo.vaultName)
      ).address,
      signer
    );
    const underlyingToken = await hre.ethers.getContractAt("MockERC20", poolInfo.inputToken, signer);
    const tokenSymbol = await underlyingToken.symbol()
    console.log(tokenSymbol);
    console.log(initalDepositAmount[tokenSymbol].toString())
    console.log("create demo SweetVault", await vault.name(), "with underlying", tokenSymbol);
    await underlyingToken.approve(vault.address, parseEther("10"));
    console.log(await (await underlyingToken.balanceOf(addresses.deployer)).toString());
    await vault.depositAndStake(initalDepositAmount[tokenSymbol]);
  };



  await makeDeposit();
}
