import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
interface Args {
  to: string;
  amount: string;
}

async function main(args: Args, hre: HardhatRuntimeEnvironment) {
  if (hre.network.name !== "kovan") {
    throw new Error(
      `This task is only valid for Kovan. The selected network is: ${hre.network.name}`
    );
  }
  const signer = hre.askForSigner();

  const lbp = await hre.ethers.getContractAt(
    "LBPManager",
    (
      await hre.deployments.get("LBPManager")
    ).address,
    signer
  );
  const tx = await lbp.deployLBP({ gasLimit: 12500000 });

  const receipt = await tx.wait(1);
  console.log("LBP deployed");
  console.log(receipt);
}

export default task(
  "LBPManager:deployLBP",
  "deploys LBP with factory"
).setAction(main);
