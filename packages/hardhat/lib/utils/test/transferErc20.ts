import { parseUnits } from "ethers/lib/utils";
import { ethers } from "hardhat";
import { getErc20, impersonateSigner } from ".";

export const transferErc20 = async (
  token: string,
  from: string,
  to: string,
  amount: string
) => {
  const [owner] = await ethers.getSigners();
  await owner.sendTransaction({
    to: from,
    value: ethers.utils.parseEther("1.0"), // Sends exactly 1.0 ether
  });

  const erc20 = await getErc20(token, await impersonateSigner(from));

  return erc20.transfer(to, parseUnits(amount, await erc20.decimals()));
};
