import { DeployFunction } from "@anthonymartin/hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

enum ProposalType {
  BeneficiaryNominationProposal,
  BeneficiaryTakedownProposal,
}
enum Vote {
  Yes,
  No,
}
const VOTE_PERIOD_IN_SECONDS = 30;
const DURATION_DAY = 24 * 60 * 60;
const DURATION_YEAR = DURATION_DAY * 365;

const main: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  console.log("Deploying Fixtures");
  const { deployments, ethers } = hre;
  const DEFAULT_REGION = ethers.utils.id("World");

  const accounts = await ethers.getSigners();
  const deployer = accounts[0];
  const voters = accounts.slice(0, 4);
  const newBeneficiaries = accounts.slice(1, 10);
  const existingBeneficiaries = accounts.slice(10, 20);

  console.log("Getting up contracts");
  const usdc = await hre.ethers.getContractAt("Test", (await deployments.get("usdc")).address);
  const faucet = await hre.ethers.getContractAt("Faucet", (await deployments.get("Faucet")).address);
};

export default main;
main.dependencies = ["setup"];
main.tags = ["core", "sig"];
