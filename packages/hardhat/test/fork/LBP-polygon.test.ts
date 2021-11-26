import { BigNumber } from "@ethersproject/bignumber";
import { expect } from "chai";
import { parseEther, parseUnits } from "ethers/lib/utils";
import { ethers, network } from "hardhat";
import { expectRevert } from "../../lib/utils/expectValue";
import getNamedAccounts from "../../lib/utils/getNamedAccounts";

const LBP_MANAGER = "0x9F3EcFDCE702514Bf3dF6f2Dc3Aa8A6937F5dd91";
const USDC_WHALE = "0x1d7d6598c766485dc89746fd9bda82c21df128a9";
const POP_WHALE = "0xa49731448a1b25d92f3d80f3d3025e4f0fc8d776";
const START_TIME = 1638172800;
const namedAccounts = getNamedAccounts();

const DAYS = 86400;
const timeTravel = async (timestamp: number) => {
  ethers.provider.send("evm_setNextBlockTimestamp", [timestamp]);
  ethers.provider.send("evm_mine", []);
};

const getErc20 = async (address, signer?) => {
  return ethers.getContractAt(
    "@openzeppelin/contracts/token/ERC20/ERC20.sol:ERC20",
    address,
    signer
  );
};
const getPoolTokenBalances = async (address) => {
  const usdc = await getErc20(namedAccounts.USDC.polygon);
  const pop = await getErc20(namedAccounts.POP.polygon);
  const usdcBalance = await usdc.balanceOf(address);
  const popBalance = await pop.balanceOf(address);
  return [usdcBalance, popBalance];
};

const transferErc20 = async (token, from, to, amount) => {
  const [owner] = await ethers.getSigners();
  await owner.sendTransaction({
    to: from,
    value: ethers.utils.parseEther("5.0"), // Sends exactly 5.0 ether
  });

  await network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [from],
  });
  const signer = await ethers.getSigner(from);
  const erc20 = await getErc20(token, signer);

  await erc20.transfer(to, parseUnits(amount, await erc20.decimals()));
};

const prepareLbpManager = async () => {
  await network.provider.request({
    method: "hardhat_reset",
    params: [
      {
        forking: {
          jsonRpcUrl: process.env.RPC_URL_POLYGON || process.env.RPC_URL,
          blockNumber: 21727614,
        },
      },
    ],
  });

  await transferErc20(
    namedAccounts.USDC.polygon,
    USDC_WHALE,
    LBP_MANAGER,
    "562500"
  );

  await transferErc20(
    namedAccounts.POP.polygon,
    POP_WHALE,
    LBP_MANAGER,
    "1875000"
  );
};

const deployPoolByImpersonation = async (): Promise<string> => {
  /**
   * send ETH to aragon dao agent address
   */
  const [owner] = await ethers.getSigners();
  await owner.sendTransaction({
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
  const tx = await lbpManager.deployLBP();
  return await lbpManager.lbp();
};

describe("LBP test", () => {
  context("polygon", () => {
    beforeEach(async () => {
      await prepareLbpManager();
    });

    it("deploys LBP from aragon dao agent address when impersonating dao agent", async () => {
      await deployPoolByImpersonation();
      const lbpManager = await ethers.getContractAt("LBPManager", LBP_MANAGER);
      const config = await lbpManager.poolConfig();
      expect(config.deployed).to.be.true;
    });

    it("has correct start time for pool", async () => {
      await deployPoolByImpersonation();
      const lbpManager = await ethers.getContractAt("LBPManager", LBP_MANAGER);
      expect((await lbpManager.poolConfig()).startTime).to.equal(START_TIME);
    });

    it("has correct configuration for LBP", async () => {
      const lbpManager = await ethers.getContractAt("LBPManager", LBP_MANAGER);
      const config = await lbpManager.poolConfig();
      const dao = await lbpManager.dao();
      expect(config.deployed).to.be.false;
      expect(config.startTime).to.equal(START_TIME);
      expect(config.swapEnabledOnStart).to.equal(false);
      expect(config.durationInSeconds).to.equal(2.5 * DAYS);
      expect(dao.treasury).to.equal(
        "0xa49731448a1b25d92F3d80f3d3025e4F0fC8d776"
      );
      expect(dao.agent).to.equal("0xa49731448a1b25d92F3d80f3d3025e4F0fC8d776");
    });

    it("will allow trading to be enabled on the 29th", async () => {
      const poolAddress = await deployPoolByImpersonation();

      const [anyone] = await ethers.getSigners();
      const lbpManager = await ethers.getContractAt(
        "LBPManager",
        LBP_MANAGER,
        anyone
      );
      const startTime = (await lbpManager.poolConfig()).startTime.toNumber();
      expect(startTime).to.equal(START_TIME);

      await timeTravel(startTime);

      await lbpManager.enableTrading();

      const lbp = await ethers.getContractAt("ILBP", poolAddress);
      expect(await lbp.getSwapEnabled()).to.be.true;
    });

    it("will not allow trading to be enabled before the 29th", async () => {
      await deployPoolByImpersonation();
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
    it("will transfer funds from LBP manager to Pool when LBP is deployed", async () => {
      await deployPoolByImpersonation();
      const [usdcBalancerAfter, popBalanceAfter] = await getPoolTokenBalances(
        LBP_MANAGER
      );
      expect(usdcBalancerAfter).to.equal(BigNumber.from("0"));
      expect(popBalanceAfter).to.equal(BigNumber.from("0"));
    });

    it("has correctly defined tokens and amounts", async () => {
      const poolAddress = await deployPoolByImpersonation();
      const vault = await ethers.getContractAt(
        "IVault",
        namedAccounts.BalancerVault.polygon
      );

      const lbp = await ethers.getContractAt("ILBP", poolAddress);
      const tokens = await vault.getPoolTokens(await lbp.getPoolId());
      expect(tokens[0].map((token) => token.toLowerCase())).to.eql([
        namedAccounts.USDC.polygon.toLowerCase(),
        namedAccounts.POP.polygon.toLowerCase(),
      ]);
      expect(tokens[1][0]).equal(parseUnits("562500", "6"));
      expect(tokens[1][1]).equal(parseEther("1875000"));
    });

    it("will transfer funds back to DAO agent when pool is closed", async () => {
      /**
       * send ETH to dao agent address
       */
      const [owner] = await ethers.getSigners();
      const transactionHash = await owner.sendTransaction({
        to: namedAccounts.DAO_Agent.polygon,
        value: ethers.utils.parseEther("5.0"), // Sends exactly 5.0 ether
      });

      await deployPoolByImpersonation();

      const [usdcBalanceBefore, popBalanceBefore] = await getPoolTokenBalances(
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

      await timeTravel(1638172800 + 100 * DAYS);

      await lbpManager.withdrawFromPool();

      const [usdcBalanceAfter, popBalanceAfter] = await getPoolTokenBalances(
        namedAccounts.DAO_Treasury.polygon
      );

      expect(usdcBalanceAfter.gt(usdcBalanceBefore)).to.be.true;
      expect(popBalanceAfter.gt(popBalanceBefore)).to.be.true;

      // console.log(
      //   "USDC balance (treasury)",
      //   formatUnits(
      //     await usdc.balanceOf(namedAccounts.DAO_Treasury.polygon),
      //     "6"
      //   )
      // );
      // console.log(
      //   "POP balance (treasury)",
      //   formatEther(await pop.balanceOf(namedAccounts.DAO_Treasury.polygon))
      // );
    });
  });
});
