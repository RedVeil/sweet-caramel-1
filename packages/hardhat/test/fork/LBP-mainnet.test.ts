import { BigNumber } from "@ethersproject/bignumber";
import { formatEther, formatUnits, parseEther } from "@ethersproject/units";
import { expect } from "chai";
import { parseUnits } from "ethers/lib/utils";
import { ethers, network } from "hardhat";
import { expectRevert } from "../../lib/utils/expectValue";
import getNamedAccounts from "../../lib/utils/getNamedAccounts";

const LBP_MANAGER = "0xe7F0E61a07D540F6Ab3C3e81D87c6ed0F2C0244d";
const USDC_WHALE = "0x6BE8ef6207b4114A52ae5011FE8846dA2Af8F281";
const POP_WHALE = "0xF023E5eF2Eb3b8747cBaD5B3847813b66E9BFdD7";
const namedAccounts = getNamedAccounts();

const DAYS = 86400;
const timeTravel = async (time?: number) => {
  ethers.provider.send("evm_increaseTime", [time || 1 * DAYS]);
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
          blockNumber: 13677417,
        },
      },
    ],
  });

  /**
   * begin USDC transfer
   */
  await network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [USDC_WHALE],
  });
  const usdcWhale = await ethers.getSigner(USDC_WHALE);
  const usdc = await getErc20(namedAccounts.USDC.mainnet, usdcWhale);

  console.log("transferring 562,500 USDC to LBP manager");
  await usdc.transfer(LBP_MANAGER, parseUnits("562500", "6"));

  /**
   * begin POP transfer
   */
  await network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [POP_WHALE],
  });
  const popWhale = await ethers.getSigner(POP_WHALE);
  const pop = await getErc20(namedAccounts.POP.mainnet, popWhale);
  console.log("transferring 1,875,000 POP to LBP manager");
  await pop.transfer(LBP_MANAGER, parseEther("1875000"));
};

const deployPoolByVote = async (): Promise<string> => {
  /**
   * Voting for proposal to deployLBP
   */
  const voting = new ethers.Contract(
    namedAccounts.Voting.mainnet,
    require("./../../external/aragon/Voting.json"),
    await ethers.getSigner(POP_WHALE)
  );
  const tx = await voting.vote(5, true, true);
  console.log("lbp deployed");

  const lbp = await ethers.getContractAt("LBPManager", LBP_MANAGER);
  expect((await lbp.poolConfig()).deployed).to.be.true;
  console.log("deployed pool", await lbp.lbp());

  return lbp.lbp();
};

describe("LBP test", () => {
  context("mainnet", () => {
    beforeEach(async () => {
      await prepareLbpManager();
    });

    it("deploys LBP from aragon dao agent address when impersonating dao agent", async () => {
      /**
       * send ETH to aragon dao agent address
       */
      const [owner] = await ethers.getSigners();
      const transactionHash = await owner.sendTransaction({
        to: namedAccounts.DAO_Agent.mainnet,
        value: ethers.utils.parseEther("5.0"), // Sends exactly 5.0 ether
      });

      /**
       * deploy LBP from aragon dao agent
       */
      await network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [namedAccounts.DAO_Agent.mainnet],
      });
      const daoAgent = await ethers.getSigner(namedAccounts.DAO_Agent.mainnet);
      const lbpManager = await ethers.getContractAt(
        "LBPManager",
        LBP_MANAGER,
        daoAgent
      );
      console.log("deploying lbpManager");
      const tx = await lbpManager.deployLBP();
      console.log("deployed");
    });

    it("deploys LBP from aragon dao agent address when voting", async () => {
      const poolAddress = await deployPoolByVote();
    });

    it("will allow trading to be enabled on the 29th", async () => {
      const poolAddress = await deployPoolByVote();
      await timeTravel(5 * DAYS);
      const [anyone] = await ethers.getSigners();
      const lbpManager = await ethers.getContractAt(
        "LBPManager",
        LBP_MANAGER,
        anyone
      );
      await lbpManager.enableTrading();

      const lbp = await ethers.getContractAt("ILBP", poolAddress);
      console.log("swap enabled", await lbp.getSwapEnabled());
      expect(await lbp.getSwapEnabled()).to.be.true;
    });

    it("will not allow trading to be enabled before the 29th", async () => {
      const poolAddress = await deployPoolByVote();
      await timeTravel(1 * DAYS);
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
      const poolAddress = await deployPoolByVote();
      const usdc = await getErc20(namedAccounts.USDC.mainnet);
      const balanceOfAfter = await usdc.balanceOf(LBP_MANAGER);

      expect(balanceOfAfter).to.equal(BigNumber.from("0"));
    });
    it("will move funds out of LBP manager when LBP is deployed", async () => {
      const poolAddress = await deployPoolByVote();
      const usdc = await getErc20(namedAccounts.USDC.mainnet);
      const balanceOfAfter = await usdc.balanceOf(LBP_MANAGER);

      expect(balanceOfAfter).to.equal(BigNumber.from("0"));
    });
    it("will transfer funds back to DAO agent when pool is closed (impersonation)", async () => {
      /**
       * send ETH to aragon dao agent address
       */
      const [owner] = await ethers.getSigners();
      const transactionHash = await owner.sendTransaction({
        to: namedAccounts.DAO_Agent.mainnet,
        value: ethers.utils.parseEther("5.0"), // Sends exactly 5.0 ether
      });

      await deployPoolByVote();
      await timeTravel(5 * DAYS);

      await network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [namedAccounts.DAO_Agent.mainnet],
      });
      const lbpManager = await ethers.getContractAt(
        "LBPManager",
        LBP_MANAGER,
        await ethers.getSigner(namedAccounts.DAO_Agent.mainnet)
      );

      await lbpManager.enableTrading();

      await lbpManager.withdrawFromPool();
      const usdc = await getErc20(namedAccounts.USDC.mainnet);
      const pop = await getErc20(namedAccounts.POP.mainnet);
      console.log(
        "USDC balance (treasury)",
        formatUnits(
          await usdc.balanceOf(namedAccounts.DAO_Treasury.mainnet),
          "6"
        )
      );
      console.log(
        "POP balance (treasury)",
        formatEther(await pop.balanceOf(namedAccounts.DAO_Treasury.mainnet))
      );
    });
  });
  it.skip("will transfer funds back to DAO agent when pool is closed (via vote)", async () => {});
});
