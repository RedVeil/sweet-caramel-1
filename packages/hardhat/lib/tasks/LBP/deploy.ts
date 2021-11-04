import { ethers } from "ethers";
import { parseEther } from "ethers/lib/utils";
import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import LBPFactoryAbi from "../../../contracts/external/abis/LBPFactory.json";
import { getNamedAccountsFromNetwork } from "../../utils/getNamedAccounts";
interface Args {
  to: string;
  amount: string;
}

async function main(args: Args, hre: HardhatRuntimeEnvironment) {
  const { BalancerLBPFactory, USDC } = getNamedAccountsFromNetwork(hre);

  const signer = hre.askForSigner();

  const deployedLbp = ethers.ContractFactory.getContract(
    BalancerLBPFactory,
    JSON.stringify(LBPFactoryAbi),
    signer
  );

  const tpopAddress = (await hre.deployments.get("POP")).address;
  console.log({ tpopAddress, USDC });

  console.log("deploying LBP");
  const tx = await deployedLbp.create(
    "Test TPOP LBP Copper Launch",
    "TPOP3_FLA",
    [tpopAddress, USDC],
    [parseEther(".99"), parseEther(".01")],
    parseEther(".015"),
    signer.address,
    false,
    { gasLimit: 5000000 }
  );

  const receipt = await tx.wait(1);
  console.log("LBP deployed");
  console.log(receipt);
}

export default task("LBP:deploy", "deploys LBP with factory").setAction(main);
