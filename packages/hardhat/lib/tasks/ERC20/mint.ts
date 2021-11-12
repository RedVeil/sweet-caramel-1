import { parseEther } from "ethers/lib/utils";
import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
interface Args {
  token: string;
  recipient: string;
  amount: string;
}

async function main(args: Args, hre: HardhatRuntimeEnvironment) {
  const signer = hre.askForSigner();

  const erc20 = await hre.ethers.getContractAt("MockERC20", args.token, signer);

  console.log(
    "Transfering ",
    parseEther(args.amount).toString(),
    "to",
    args.recipient
  );

  await erc20.mint(args.recipient, parseEther(args.amount));
}

export default task("ERC20:mint", "transfers tokens to recipient")
  .addParam("token", "token address")
  .addParam("recipient", "spender address")
  .addParam("amount", "amount to send")
  .setAction(main);
