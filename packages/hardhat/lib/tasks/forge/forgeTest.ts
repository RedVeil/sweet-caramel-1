import "@popcorn/utils/src/envLoader";

import { exec } from "child_process";
import fs from "fs";
import { task } from "hardhat/config";
import path from "path";
import util from "util";

const forge = {
  fork: {
    blocks: {
      "vault/Vault.t.sol": 15008113,
      "vault/VaultsV1Zapper.t.sol": 15414618,
      "ZeroXSwapZapIn.t.sol": 15521406,
      "ZeroXSwapZapOut.t.sol": 15521406,
      "ThreeXWhaleProcessing.t.sol": 15008113,
      "ButterFeeConverter.t.sol": 15008113,
      "vault/VaultsV1Registry.t.sol": 15008113,
      "vault/VaultsV1Factory.t.sol": 15008113,
      "vault/VaultStakingFactory.t.sol": 15008113,
      "vault/VaultsV1Controller.t.sol": 15008113,
      "vault/VaultUnitTest.t.sol": 15008113,
      "YearnVaultWrapper.t.sol": 15008113,
      "RewardsDistribution.t.sol": 15008113,
    },
    forkDirectory: "fork",
  },
};

const execCommand = util.promisify(exec);

interface Args {
  url: number;
}

async function executeCommand(command: string): Promise<void> {
  try {
    const { stdout, stderr } = await execCommand(command);
    console.log(stdout);
    console.log("stderr:", stderr);
  } catch (e) {
    console.error(e); // should contain code (exit code) and signal (that caused the termination).
    process.exit(1);
  }
}

export default task("forge:forge-test", "run forge tests").setAction(async (args: Args, hre) => {
  const rpcUrl = process.env.RPC_URL;
  if (!rpcUrl) {
    console.error("$RPC_URL environment variable not found.");
    process.exit(1);
  }
  const command = `forge test -vvv`;

  const dirPath = path.join(__dirname, "../../../", "/test/forge", forge.fork.forkDirectory);
  const files = fs.readdirSync(dirPath).filter((file) => file.includes(".sol"));
  console.log(files)
  for (let file of files) {
    let blockNumber = forge.fork.blocks[file];
    const shellCommand =
      command +
      ` --fork-url ${rpcUrl} --fork-block-number ${blockNumber} --match-path test/forge/fork/${file} --no-match-contract 'Abstract|SimulateThreeXBatchSlippage'`;
    await executeCommand(shellCommand);
  }
});
