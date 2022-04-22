import { parseEther } from "@ethersproject/units";
import { ethers, network } from "hardhat";
import { getERC20Contract } from "../../../utils/src/contractHelpers";
import { expectValue } from "../../lib/utils/expectValue";
import { getNamedAccountsByChainId } from "../../lib/utils/getNamedAccounts";
import { impersonateSigner, sendEth } from "../../lib/utils/test";

const { pop, rewardsDistribution, popUsdcLpStaking } = getNamedAccountsByChainId(1);

describe("rewards distribution test", () => {
  context("create vote to transfer tokens from agent", () => {
    beforeEach(async () => {
      await network.provider.request({
        method: "hardhat_reset",
        params: [
          {
            forking: {
              jsonRpcUrl: process.env.RPC_URL,
              blockNumber: 14149093,
            },
          },
        ],
      });
    });

    it("should allow rewards manager to approve multiple times", async () => {
      const distributionContract = await impersonateSigner(rewardsDistribution);
      await sendEth(rewardsDistribution, "100");
      const popContract = await getERC20Contract(pop, ethers.provider);
      console.log("approving ...");
      await popContract.connect(distributionContract).decreaseAllowance(popUsdcLpStaking, parseEther("0"));
    });

    it("should allow an EOA to approve multiple times", async () => {
      const eoa = await impersonateSigner("0x4476D23d376c6A47a1f97BA9D8b8BaCc59cC5E3F");
      await sendEth(await eoa.getAddress(), "100");
      const popContract = await getERC20Contract(pop, ethers.provider);
      console.log("approving ...");
      await popContract.connect(eoa).approve(popUsdcLpStaking, parseEther("100"));
      console.log("approving again ...");
      await popContract.connect(eoa).approve(popUsdcLpStaking, parseEther("100"));
      console.log("approved twice");
    });

    it("should allow an EOA to approve multiple times", async () => {
      const eoa = await impersonateSigner("0x4476D23d376c6A47a1f97BA9D8b8BaCc59cC5E3F");
      await sendEth(await eoa.getAddress(), "100");
      const popContract = await getERC20Contract(pop, ethers.provider);
      console.log("approving ...");
      await popContract.connect(eoa).approve(popUsdcLpStaking, parseEther("100"));
      console.log("approving again ...");
      await popContract.connect(eoa).approve(popUsdcLpStaking, parseEther("0"));
      console.log("approved twice");
      await popContract.connect(eoa).approve(popUsdcLpStaking, parseEther("200"));
      console.log("approved thrice");
    });

    it("should distribute rewards successfully", async () => {
      const deployer = await impersonateSigner("0x92a1cB552d0e177f3A135B4c87A4160C8f2a485f");
      const distributor = await (
        await ethers.getContractAt("RewardsDistribution", rewardsDistribution)
      ).connect(deployer);
      await distributor.editRewardDistribution(1, popUsdcLpStaking, 0, false);
      await distributor.distributeRewards(parseEther(".000000000001"));
      await distributor.editRewardDistribution(1, popUsdcLpStaking, parseEther("1000"), false);
      await distributor.distributeRewards(parseEther("1000"));
    });

    it("can distribute all funds back to treasury", async () => {
      const NEW_TREASURY = "0xf7b932085508ddbDD2CBBE7C4C8DCf35904aaf0e";
      const deployer = await impersonateSigner("0x92a1cB552d0e177f3A135B4c87A4160C8f2a485f");
      const distributor = await (
        await ethers.getContractAt("RewardsDistribution", rewardsDistribution)
      ).connect(deployer);
      const popContract = await getERC20Contract(pop, ethers.provider);
      const distributorBalance = await popContract.balanceOf(rewardsDistribution);
      await distributor.setTreasury(NEW_TREASURY);
      await distributor.editRewardDistribution(1, popUsdcLpStaking, 0, false);
      await distributor.distributeRewards(distributorBalance);
      await expectValue(await popContract.balanceOf(NEW_TREASURY), distributorBalance);
    });
  });
});
