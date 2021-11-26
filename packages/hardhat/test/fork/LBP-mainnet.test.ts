import { BigNumber } from "@ethersproject/bignumber";
import { parseEther } from "@ethersproject/units";
import { expect } from "chai";
import { parseUnits } from "ethers/lib/utils";
import { ethers, network } from "hardhat";
import { encodeCallScript } from "../../lib/utils/callscript";
import { expectRevert } from "../../lib/utils/expectValue";
import getNamedAccounts from "../../lib/utils/getNamedAccounts";

const LBP_MANAGER = "0xe7F0E61a07D540F6Ab3C3e81D87c6ed0F2C0244d";
const USDC_WHALE = "0x6BE8ef6207b4114A52ae5011FE8846dA2Af8F281";
const POP_WHALE = "0xF023E5eF2Eb3b8747cBaD5B3847813b66E9BFdD7";
const namedAccounts = getNamedAccounts();
const START_TIME = 1638172800;

const DAYS = 86400;
const timeTravel = async (time?: number) => {
  ethers.provider.send("evm_increaseTime", [time || 1 * DAYS]);
  ethers.provider.send("evm_mine", []);
};

const setTimestamp = async (timestamp: number) => {
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

  //console.log("transferring 562,500 USDC to LBP manager");
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
  // console.log("transferring 1,875,000 POP to LBP manager");
  await pop.transfer(LBP_MANAGER, parseEther("1875000"));
};

const deployPoolByVote = async (): Promise<string> => {
  /**
   * Voting for proposal to deployLBP
   */
  const voting = new ethers.Contract(
    namedAccounts.Voting.mainnet,
    require("../../lib/external/aragon/Voting.json"),
    await ethers.getSigner(POP_WHALE)
  );
  const tx = await voting.vote(5, true, true);

  const lbp = await ethers.getContractAt("LBPManager", LBP_MANAGER);

  return lbp.lbp();
};

const getPoolTokenBalances = async (address) => {
  const usdc = await getErc20(namedAccounts.USDC.mainnet);
  const pop = await getErc20(namedAccounts.POP.mainnet);
  const usdcBalance = await usdc.balanceOf(address);
  const popBalance = await pop.balanceOf(address);
  return [usdcBalance, popBalance];
};

describe("LBP test", () => {
  context("mainnet", () => {
    beforeEach(async () => {
      await prepareLbpManager();
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
        "0x0Ec6290aBb4714ba5f1371647894Ce53c6dD673a"
      );
      expect(dao.agent).to.equal("0x0Ec6290aBb4714ba5f1371647894Ce53c6dD673a");
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
      const tx = await lbpManager.deployLBP();
      const lbp = await lbpManager.lbp();

      const config = await lbpManager.poolConfig();
      expect(config.deployed).to.be.true;
      expect(lbp).to.equal("0x604A625B1db031e8CdE1D49d30d425E0b6cf734f");
    });

    it("deploys LBP from aragon dao agent address when voting", async () => {
      const lbpManager = await ethers.getContractAt("LBPManager", LBP_MANAGER);

      const poolAddress = await deployPoolByVote();
      const lbp = await ethers.getContractAt("ILBP", poolAddress);

      const config = await lbpManager.poolConfig();

      expect(config.deployed).to.be.true;
      expect(poolAddress).to.equal(
        "0x604A625B1db031e8CdE1D49d30d425E0b6cf734f"
      );
    });

    it("will allow trading to be enabled on the 29th", async () => {
      const poolAddress = await deployPoolByVote();
      const [anyone] = await ethers.getSigners();
      const lbpManager = await ethers.getContractAt(
        "LBPManager",
        LBP_MANAGER,
        anyone
      );

      await setTimestamp((await lbpManager.poolConfig()).startTime.toNumber());

      await lbpManager.enableTrading();

      const lbp = await ethers.getContractAt("ILBP", poolAddress);
      expect(await lbp.getSwapEnabled()).to.be.true;
    });

    it("will not allow trading to be enabled before the 29th", async () => {
      const poolAddress = await deployPoolByVote();

      await setTimestamp(START_TIME - 15);

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
      const poolAddress = await deployPoolByVote();
      const [usdcBalancerAfter, popBalanceAfter] = await getPoolTokenBalances(
        LBP_MANAGER
      );
      const vault = await ethers.getContractAt(
        "IVault",
        namedAccounts.BalancerVault.mainnet
      );

      const lbp = await ethers.getContractAt("ILBP", poolAddress);
      const tokens = await vault.getPoolTokens(await lbp.getPoolId());

      expect(tokens[0].map((token) => token.toLowerCase())).to.eql([
        namedAccounts.USDC.mainnet.toLowerCase(),
        namedAccounts.POP.mainnet.toLowerCase(),
      ]);
      expect(tokens[1][0]).equal(parseUnits("562500", "6"));
      expect(tokens[1][1]).equal(parseEther("1875000"));
      expect(usdcBalancerAfter).to.equal(BigNumber.from("0"));
      expect(popBalanceAfter).to.equal(BigNumber.from("0"));
    });

    it("will transfer funds back to DAO agent when pool is closed (impersonation)", async () => {
      /**
       * send ETH to aragon dao agent address
       */
      const [owner] = await ethers.getSigners();
      await owner.sendTransaction({
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

      const [usdcBalanceBefore, popBalanceBefore] = await getPoolTokenBalances(
        namedAccounts.DAO_Treasury.mainnet
      );

      await lbpManager.withdrawFromPool();

      const [usdcBalanceAfter, popBalanceAfter] = await getPoolTokenBalances(
        namedAccounts.DAO_Treasury.mainnet
      );

      expect(usdcBalanceAfter.gt(usdcBalanceBefore)).to.be.true;
      expect(popBalanceAfter.gt(popBalanceBefore)).to.be.true;

      // console.log(
      //   "USDC balance (treasury)",
      //   formatUnits(
      //     await usdc.balanceOf(namedAccounts.DAO_Treasury.mainnet),
      //     "6"
      //   )
      // );
      // console.log(
      //   "POP balance (treasury)",
      //   formatEther(await pop.balanceOf(namedAccounts.DAO_Treasury.mainnet))
      // );
    });
    it("will transfer funds back to DAO agent when pool is closed (via vote)", async () => {
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
      expect(await lbp.getSwapEnabled()).to.be.true;

      await timeTravel(5 * DAYS);

      await network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [POP_WHALE],
      });
      const signer = await ethers.getSigner(POP_WHALE);

      const voting = new ethers.Contract(
        namedAccounts.Voting.mainnet,
        require("../../lib/external/aragon/Voting.json"),
        signer
      );

      const agent = new ethers.Contract(
        namedAccounts.DAO_Agent.mainnet,
        require("../../lib/external/aragon/Agent.json")
      );

      const tokens = new ethers.Contract(
        namedAccounts.TokenManager.mainnet,
        require("../../lib/external/aragon/TokenManager.json"),
        signer
      );

      const evmScript = encodeCallScript([
        {
          to: namedAccounts.DAO_Agent.mainnet,
          data: agent.interface.encodeFunctionData(
            "execute(address,uint256,bytes)",
            [
              LBP_MANAGER,
              0,
              lbpManager.interface.encodeFunctionData("withdrawFromPool"), // withdrawFromPool()
            ]
          ),
        },
      ]);

      const voteEvmScript = encodeCallScript([
        {
          to: namedAccounts.Voting.mainnet,
          data: voting.interface.encodeFunctionData("newVote(bytes,string)", [
            evmScript,
            "",
          ]),
        },
      ]);

      await tokens.forward(voteEvmScript);

      const [usdcBalanceBefore, popBalanceBefore] = await getPoolTokenBalances(
        namedAccounts.DAO_Treasury.mainnet
      );

      await voting.vote(6, true, true);

      const [usdcBalanceAfter, popBalanceAfter] = await getPoolTokenBalances(
        namedAccounts.DAO_Treasury.mainnet
      );

      expect(usdcBalanceAfter.gt(usdcBalanceBefore)).to.be.true;
      expect(popBalanceAfter.gt(popBalanceBefore)).to.be.true;
    });
  });
});
