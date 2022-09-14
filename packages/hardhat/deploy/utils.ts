import { ethers } from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { parseEther } from "ethers/lib/utils";

export const addContractToRegistry = async (
  contractName: string,
  deployments,
  signer,
  hre: HardhatRuntimeEnvironment
) => {
  const contractRegistry = await hre.ethers.getContractAt(
    "ContractRegistry",
    (
      await deployments.get("ContractRegistry")
    ).address,
    signer
  );

  const contract = await contractRegistry.getContract(ethers.utils.id(contractName));

  console.log(`Adding contract ${contractName} to registry`);
  if (contract === ethers.constants.AddressZero) {
    await contractRegistry.addContract(
      ethers.utils.id(contractName),
      (
        await deployments.get(contractName)
      ).address,
      ethers.utils.id("1"),
      { gasLimit: 1000000 }
    );
  } else {
    console.log(`${contractName} already exists in registry, updating entry ...`);

    const tx = await contractRegistry.updateContract(
      ethers.utils.id(contractName),
      (
        await deployments.get(contractName)
      ).address,
      ethers.utils.id("2" + new Date().getTime().toString()),
      { gasLimit: 1000000 }
    );
    if (!["hardhat", "local"].includes(hre.network.name)) {
      await tx.wait(1);
    }
  }
};

export const FaucetController = async (hre, signer) => {
  const initialize = await (() =>
    async function (hre: HardhatRuntimeEnvironment, signer) {
      const faucetAddress = (await hre.deployments.get("Faucet")).address;
      if ((await hre.ethers.provider.getBalance(faucetAddress)).lt(parseEther("100000"))) {
        await hre.network.provider.send("hardhat_setBalance", [
          faucetAddress,
          "0x152d02c7e14af6800000", // 100k ETH
        ]);
      }
      return hre.ethers.getContractAt("Faucet", faucetAddress, signer);
    })();

  const _faucet = await initialize(hre, signer);

  return {
    faucet: _faucet,
    sendDai: async (recipient, amount: number) => {
      const addresses = await hre.getNamedAccounts();
      console.log("sending dai...");
      await _faucet.sendTokens(addresses.dai, amount, recipient);
    },

    sendUsdc: async (recipient, amount: number) => {
      const addresses = await hre.getNamedAccounts();
      console.log("sending usdc...");
      await _faucet.sendTokens(addresses.usdc, amount, recipient);
    },

    sendCrvSethLPTokens: async (recipient, amount) => {
      return _faucet.sendCrvSethLPTokens(amount, recipient);
    },
  };
};

module.exports.skip = () => true;
