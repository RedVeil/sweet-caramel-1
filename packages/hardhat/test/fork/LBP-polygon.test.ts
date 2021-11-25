import { BigNumber } from "@ethersproject/bignumber";
import { formatEther, formatUnits, parseEther } from "@ethersproject/units";
import { expect } from "chai";
import { parseUnits } from "ethers/lib/utils";
import { ethers, network } from "hardhat";
import { expectRevert } from "../../lib/utils/expectValue";
import getNamedAccounts from "../../lib/utils/getNamedAccounts";

const LBP_MANAGER = "0x9F3EcFDCE702514Bf3dF6f2Dc3Aa8A6937F5dd91";
const USDC_WHALE = "0x1d7d6598c766485dc89746fd9bda82c21df128a9";
const POP_WHALE = "0xa49731448a1b25d92f3d80f3d3025e4f0fc8d776";
const namedAccounts = getNamedAccounts();

const DAYS = 86400;
const timeTravel = async (timestamp: number) => {
  ethers.provider.send("evm_setNextBlockTimestamp", [timestamp]);
  ethers.provider.send("evm_mine", []);
};

const getErc20 = async (address, signer?) => {
  return ethers.getContractAt(
    "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20",
    address,
    signer
  );
};

const prepareLbpManager = async () => {
  await network.provider.request({
    method: "hardhat_reset",
    params: [
      {
        forking: {
          jsonRpcUrl: process.env.RPC_URL,
          blockNumber: 21727614,
        },
      },
    ],
  });

  /**
   * begin USDC transfer
   */
  const [owner] = await ethers.getSigners();
  console.log("balance is", formatEther(await owner.getBalance()));
  await owner.sendTransaction({
    to: USDC_WHALE,
    value: ethers.utils.parseEther("5.0"), // Sends exactly 5.0 ether
  });

  await network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [USDC_WHALE],
  });
  const usdcWhale = await ethers.getSigner(USDC_WHALE);
  const usdc = await getErc20(namedAccounts.USDC.polygon, usdcWhale);

  console.log("transferring 562,500 USDC to LBP manager");
  await usdc.transfer(LBP_MANAGER, parseUnits("562500", "6"));

  /**
   * begin POP transfer
   */
  await owner.sendTransaction({
    to: POP_WHALE,
    value: ethers.utils.parseEther("5.0"), // Sends exactly 5.0 ether
  });
  await network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [POP_WHALE],
  });
  const popWhale = await ethers.getSigner(POP_WHALE);
  const pop = await getErc20(namedAccounts.POP.polygon, popWhale);
  console.log("transferring 1,875,000 POP to LBP manager");
  await pop.transfer(LBP_MANAGER, parseEther("1875000"));
};

const deployPoolByImpersonation = async (): Promise<string> => {
  /**
   * send ETH to aragon dao agent address
   */
  const [owner] = await ethers.getSigners();
  const transactionHash = await owner.sendTransaction({
    to: namedAccounts.DAO_Agent.polygon,
    value: ethers.utils.parseEther("5.0"), // Sends exactly 5.0 ether
  });

  /**
   * deploy LBP from aragon dao agent
   */
  await network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [namedAccounts.DAO_Agent.polygon],
  });
  const daoAgent = await ethers.getSigner(namedAccounts.DAO_Agent.polygon);
  const lbpManager = await ethers.getContractAt(
    "LBPManager",
    LBP_MANAGER,
    daoAgent
  );
  console.log("deploying lbpManager");
  const tx = await lbpManager.deployLBP();
  console.log("deployed");
  return await lbpManager.lbp();
};

describe("LBP test", () => {
  context("polygon", () => {
    beforeEach(async () => {
      console.log("prepping LBP");
      await prepareLbpManager();
      console.log("prepped LBP");
    });

    it("deploys LBP from aragon dao agent address when impersonating dao agent", async () => {
      await deployPoolByImpersonation();
    });

    it("has correct start time for pool", async () => {
      await deployPoolByImpersonation();
      const lbpManager = await ethers.getContractAt("LBPManager", LBP_MANAGER);
      expect((await lbpManager.poolConfig()).startTime).to.equal(1638172800);
    });

    it("will allow trading to be enabled on the 29th", async () => {
      const poolAddress = await deployPoolByImpersonation();

      const [anyone] = await ethers.getSigners();
      const lbpManager = await ethers.getContractAt(
        "LBPManager",
        LBP_MANAGER,
        anyone
      );

      await timeTravel(
        parseInt((await lbpManager.poolConfig()).startTime.toString())
      );

      await lbpManager.enableTrading();

      const lbp = await ethers.getContractAt("ILBP", poolAddress);
      console.log("swap enabled", await lbp.getSwapEnabled());
      expect(await lbp.getSwapEnabled()).to.be.true;
    });

    it("will not allow trading to be enabled before the 29th", async () => {
      const poolAddress = await deployPoolByImpersonation();
      await timeTravel(1638172800 - 60);
      const [anyone] = await ethers.getSigners();
      const lbpManager = await ethers.getContractAt(
        "LBPManager",
        LBP_MANAGER,
        anyone
      );
      await expectRevert(
        lbpManager.enableTrading(),
        "Trading can not be enabled yet"
      );
    });
    it("will move funds out of LBP manager when LBP is deployed", async () => {
      const poolAddress = await deployPoolByImpersonation();
      const usdc = await getErc20(namedAccounts.USDC.polygon);
      const balanceOfAfter = await usdc.balanceOf(LBP_MANAGER);

      expect(balanceOfAfter).to.equal(BigNumber.from("0"));
    });
    it("will move funds out of LBP manager when LBP is deployed", async () => {
      const poolAddress = await deployPoolByImpersonation();
      const usdc = await getErc20(namedAccounts.USDC.polygon);
      const balanceOfAfter = await usdc.balanceOf(LBP_MANAGER);

      expect(balanceOfAfter).to.equal(BigNumber.from("0"));
    });
    it("will transfer funds back to DAO agent when pool is closed", async () => {
      const usdc = await getErc20(namedAccounts.USDC.polygon);
      const pop = await getErc20(namedAccounts.POP.polygon);
      /**
       * send ETH to aragon dao agent address
       */
      const [owner] = await ethers.getSigners();
      const transactionHash = await owner.sendTransaction({
        to: namedAccounts.DAO_Agent.polygon,
        value: ethers.utils.parseEther("5.0"), // Sends exactly 5.0 ether
      });

      await deployPoolByImpersonation();

      const usdcBalanceBefore = await usdc.balanceOf(
        namedAccounts.DAO_Treasury.polygon
      );
      const popBalanceBefore = await pop.balanceOf(
        namedAccounts.DAO_Treasury.polygon
      );

      await timeTravel(1638172800);

      await network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [namedAccounts.DAO_Agent.polygon],
      });
      const lbpManager = await ethers.getContractAt(
        "LBPManager",
        LBP_MANAGER,
        await ethers.getSigner(namedAccounts.DAO_Agent.polygon)
      );

      await lbpManager.enableTrading();

      await lbpManager.withdrawFromPool();

      const usdcBalanceAfter = await usdc.balanceOf(
        namedAccounts.DAO_Treasury.polygon
      );
      const popBalanceAfter = await pop.balanceOf(
        namedAccounts.DAO_Treasury.polygon
      );

      expect(usdcBalanceAfter.gt(usdcBalanceBefore));
      expect(popBalanceAfter.gt(popBalanceBefore));

      console.log(
        "USDC balance (treasury)",
        formatUnits(
          await usdc.balanceOf(namedAccounts.DAO_Treasury.polygon),
          "6"
        )
      );
      console.log(
        "POP balance (treasury)",
        formatEther(await pop.balanceOf(namedAccounts.DAO_Treasury.polygon))
      );
    });
  });
});
