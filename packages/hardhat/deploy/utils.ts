import { ethers } from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";

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

  const contract = await contractRegistry.getContract(
    ethers.utils.id(contractName)
  );

  if (contract === ethers.constants.AddressZero) {
    console.log(`Adding contract ${contractName} to registry`);
    await contractRegistry.addContract(
      ethers.utils.id(contractName),
      (
        await deployments.get(contractName)
      ).address,
      ethers.utils.id("1"),
      { gasLimit: 1000000 }
    );
  } else {
    console.log(
      `${contractName} already exists in registry, updating entry ...`
    );

    const tx = await contractRegistry.updateContract(
      ethers.utils.id(contractName),
      (
        await deployments.get(contractName)
      ).address,
      ethers.utils.id("2" + new Date().getTime().toString()),
      { gasLimit: 1000000 }
    );
    await tx.wait(1);
  }
};
module.exports.skip = () => true;
