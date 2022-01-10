import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { parseEther } from "ethers/lib/utils";
import { ethers } from "hardhat";
import { expectRevert } from "../lib/utils/expectValue";
import { MockCurveThreepool, MockERC20 } from "../typechain";
import { ButterWhaleProcessing } from "../typechain/ButterWhaleProcessing";
import { MockBasicIssuanceModule } from "../typechain/MockBasicIssuanceModule";
import { MockCurveMetapool } from "../typechain/MockCurveMetapool";
import { MockYearnV2Vault } from "../typechain/MockYearnV2Vault";

interface Contracts {
  mockDAI: MockERC20;
  mockUSDC: MockERC20;
  mockUSDT: MockERC20;
  mock3Crv: MockERC20;
  mockPop: MockERC20;
  mockCrvUSDX: MockERC20;
  mockCrvUST: MockERC20;
  mockSetToken: MockERC20;
  mockYearnVaultUSDX: MockYearnV2Vault;
  mockYearnVaultUST: MockYearnV2Vault;
  mockCurveMetapoolUSDX: MockCurveMetapool;
  mockCurveMetapoolUST: MockCurveMetapool;
  mockCurveThreePool: MockCurveThreepool;
  mockBasicIssuanceModule: MockBasicIssuanceModule;
  butterWhaleProcessing: ButterWhaleProcessing;
}

const DepositorInitial = parseEther("100000");

let owner: SignerWithAddress, depositor: SignerWithAddress;
let contracts: Contracts;

async function deployContracts(): Promise<Contracts> {
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const mock3Crv = await (
    await MockERC20.deploy("3Crv", "3Crv", 18)
  ).deployed();
  const mockBasicCoin = await (
    await MockERC20.deploy("Basic", "Basic", 18)
  ).deployed();
  const mockPop = await (await MockERC20.deploy("POP", "POP", 18)).deployed();
  const mockDAI = await (await MockERC20.deploy("DAI", "DAI", 18)).deployed();
  const mockUSDC = await (
    await MockERC20.deploy("USDC", "USDC", 18)
  ).deployed();
  const mockUSDT = await (
    await MockERC20.deploy("USDT", "USDT", 18)
  ).deployed();

  await mock3Crv.mint(depositor.address, DepositorInitial);
  await mockDAI.mint(depositor.address, DepositorInitial);

  const mockCrvUSDX = await (
    await MockERC20.deploy("crvUSDX", "crvUSDX", 18)
  ).deployed();
  const mockCrvUST = await (
    await MockERC20.deploy("crvUST", "crvUST", 18)
  ).deployed();
  const mockSetToken = await await MockERC20.deploy("setToken", "setToken", 18);

  const MockYearnV2Vault = await ethers.getContractFactory("MockYearnV2Vault");
  const mockYearnVaultUSDX = (await (
    await MockYearnV2Vault.deploy(mockCrvUSDX.address)
  ).deployed()) as MockYearnV2Vault;
  const mockYearnVaultUST = (await (
    await MockYearnV2Vault.deploy(mockCrvUST.address)
  ).deployed()) as MockYearnV2Vault;

  const MockCurveMetapool = await ethers.getContractFactory(
    "MockCurveMetapool"
  );

  //Besides crvUSDX and 3Crv no coins are needed in this test which is why i used the same token in the other places
  const mockCurveMetapoolUSDX = (await (
    await MockCurveMetapool.deploy(
      mockBasicCoin.address,
      mockCrvUSDX.address,
      mock3Crv.address,
      mockBasicCoin.address,
      mockBasicCoin.address,
      mockBasicCoin.address
    )
  ).deployed()) as MockCurveMetapool;
  const mockCurveMetapoolUST = (await (
    await MockCurveMetapool.deploy(
      mockBasicCoin.address,
      mockCrvUST.address,
      mock3Crv.address,
      mockBasicCoin.address,
      mockBasicCoin.address,
      mockBasicCoin.address
    )
  ).deployed()) as MockCurveMetapool;

  const MockCurveThreepool = await ethers.getContractFactory(
    "MockCurveThreepool"
  );
  const mockCurveThreePool = (await (
    await MockCurveThreepool.deploy(
      mock3Crv.address,
      mockDAI.address,
      mockUSDC.address,
      mockUSDT.address
    )
  ).deployed()) as MockCurveThreepool;

  const mockBasicIssuanceModule = (await (
    await (
      await ethers.getContractFactory("MockBasicIssuanceModule")
    ).deploy([mockYearnVaultUSDX.address, mockYearnVaultUST.address], [50, 50])
  ).deployed()) as MockBasicIssuanceModule;

  const aclRegistry = await (
    await (await ethers.getContractFactory("ACLRegistry")).deploy()
  ).deployed();

  const contractRegistry = await (
    await (
      await ethers.getContractFactory("ContractRegistry")
    ).deploy(aclRegistry.address)
  ).deployed();

  const butterWhaleProcessing = (await (
    await (
      await ethers.getContractFactory("ButterWhaleProcessing")
    ).deploy(
      contractRegistry.address,
      mockSetToken.address,
      mock3Crv.address,
      mockCurveThreePool.address,
      mockBasicIssuanceModule.address,
      [mockYearnVaultUSDX.address, mockYearnVaultUST.address],
      [
        {
          curveMetaPool: mockCurveMetapoolUSDX.address,
          crvLPToken: mockCrvUSDX.address,
        },
        {
          curveMetaPool: mockCurveMetapoolUST.address,
          crvLPToken: mockCrvUST.address,
        },
      ]
    )
  ).deployed()) as ButterWhaleProcessing;

  await aclRegistry.grantRole(ethers.utils.id("DAO"), owner.address);
  await aclRegistry.grantRole(ethers.utils.id("Keeper"), owner.address);

  await butterWhaleProcessing.setApprovals();

  await contractRegistry
    .connect(owner)
    .addContract(ethers.utils.id("POP"), mockPop.address, ethers.utils.id("1"));

  return {
    mockDAI,
    mockUSDC,
    mockUSDT,
    mock3Crv,
    mockPop,
    mockCrvUSDX,
    mockCrvUST,
    mockSetToken,
    mockYearnVaultUSDX,
    mockYearnVaultUST,
    mockCurveMetapoolUSDX,
    mockCurveMetapoolUST,
    mockCurveThreePool,
    mockBasicIssuanceModule,
    butterWhaleProcessing,
  };
}

const deployAndAssignContracts = async () => {
  [owner, depositor] = await ethers.getSigners();
  contracts = await deployContracts();

  await contracts.mockYearnVaultUSDX.mint(
    contracts.mockBasicIssuanceModule.address,
    parseEther("200000")
  );
  await contracts.mockYearnVaultUST.mint(
    contracts.mockBasicIssuanceModule.address,
    parseEther("200000")
  );
  await contracts.mockCrvUSDX.mint(
    contracts.mockYearnVaultUSDX.address,
    parseEther("200000")
  );
  await contracts.mockCrvUST.mint(
    contracts.mockYearnVaultUST.address,
    parseEther("200000")
  );

  await contracts.mock3Crv
    .connect(depositor)
    .approve(contracts.butterWhaleProcessing.address, DepositorInitial);
  await contracts.mockDAI
    .connect(depositor)
    .approve(contracts.butterWhaleProcessing.address, DepositorInitial);
  await contracts.mockUSDC
    .connect(depositor)
    .approve(contracts.butterWhaleProcessing.address, DepositorInitial);
};

describe("butterWhaleProcessing", function () {
  beforeEach(async function () {
    await deployAndAssignContracts();
  });
  context("setters and getters", () => {
    describe("setApprovals", async () => {
      it("sets approvals idempotently", async () => {
        //  run setApproval multiple times to assert idempotency
        await contracts.butterWhaleProcessing.setApprovals();
        await contracts.butterWhaleProcessing.setApprovals();
        await contracts.butterWhaleProcessing.setApprovals();

        const threeCrvMetapoolAllowance_0 = await contracts.mock3Crv.allowance(
          contracts.butterWhaleProcessing.address,
          contracts.mockCurveMetapoolUSDX.address
        );
        const yearnAllowance_0 = await contracts.mockCrvUSDX.allowance(
          contracts.butterWhaleProcessing.address,
          contracts.mockYearnVaultUSDX.address
        );

        const lpMetapoolAllowance_0 = await contracts.mockCrvUSDX.allowance(
          contracts.butterWhaleProcessing.address,
          contracts.mockCurveMetapoolUSDX.address
        );

        expect(threeCrvMetapoolAllowance_0).to.equal(
          ethers.constants.MaxUint256
        );
        expect(yearnAllowance_0).to.equal(ethers.constants.MaxUint256);
        expect(lpMetapoolAllowance_0).to.equal(ethers.constants.MaxUint256);

        const threeCrvMetapoolAllowance_1 = await contracts.mock3Crv.allowance(
          contracts.butterWhaleProcessing.address,
          contracts.mockCurveMetapoolUST.address
        );
        const yearnAllowance_1 = await contracts.mockCrvUST.allowance(
          contracts.butterWhaleProcessing.address,
          contracts.mockYearnVaultUST.address
        );

        const lpMetapoolAllowance_1 = await contracts.mockCrvUST.allowance(
          contracts.butterWhaleProcessing.address,
          contracts.mockCurveMetapoolUST.address
        );

        expect(threeCrvMetapoolAllowance_1).to.equal(
          ethers.constants.MaxUint256
        );
        expect(yearnAllowance_1).to.equal(ethers.constants.MaxUint256);
        expect(lpMetapoolAllowance_1).to.equal(ethers.constants.MaxUint256);

        const dai3PoolAllowance = await contracts.mockDAI.allowance(
          contracts.butterWhaleProcessing.address,
          contracts.mockCurveThreePool.address
        );
        const usdc3PoolAllowance = await contracts.mockUSDC.allowance(
          contracts.butterWhaleProcessing.address,
          contracts.mockCurveThreePool.address
        );
        const usdt3PoolAllowance = await contracts.mockUSDT.allowance(
          contracts.butterWhaleProcessing.address,
          contracts.mockCurveThreePool.address
        );

        const threeCrvButterBatchAllowance = await contracts.mock3Crv.allowance(
          contracts.butterWhaleProcessing.address,
          contracts.mockCurveThreePool.address
        );

        expect(dai3PoolAllowance).to.equal(ethers.constants.MaxUint256);
        expect(usdc3PoolAllowance).to.equal(ethers.constants.MaxUint256);
        expect(usdt3PoolAllowance).to.equal(ethers.constants.MaxUint256);
        expect(threeCrvButterBatchAllowance).to.equal(
          ethers.constants.MaxUint256
        );
      });
    });
    describe("setCurvePoolTokenPairs", () => {
      it("sets curve pool token pairs", async () => {
        const YUST_TOKEN_ADDRESS = "0x1c6a9783f812b3af3abbf7de64c3cd7cc7d1af44";
        const UST_METAPOOL_ADDRESS =
          "0x890f4e345B1dAED0367A877a1612f86A1f86985f";
        const CRV_UST_TOKEN_ADDRESS =
          "0x94e131324b6054c0D789b190b2dAC504e4361b53";
        await contracts.butterWhaleProcessing
          .connect(owner)
          .setCurvePoolTokenPairs(
            [YUST_TOKEN_ADDRESS],
            [
              {
                curveMetaPool: UST_METAPOOL_ADDRESS,
                crvLPToken: CRV_UST_TOKEN_ADDRESS,
              },
            ]
          );
        expect(
          await contracts.butterWhaleProcessing.curvePoolTokenPairs(
            YUST_TOKEN_ADDRESS
          )
        ).to.deep.eq([UST_METAPOOL_ADDRESS, CRV_UST_TOKEN_ADDRESS]);
      });
    });
  });
  describe("minting", function () {
    context("reverts", function () {
      it("reverts when slippage is too high", async function () {
        await expectRevert(
          contracts.butterWhaleProcessing
            .connect(depositor)
            .mint(parseEther("10000"), parseEther("10000")),
          "slippage too high"
        );
      });
      it("reverts when user balance is too small", async function () {
        await expectRevert(
          contracts.butterWhaleProcessing
            .connect(depositor)
            .mint(parseEther("999990"), 0),
          "insufficent balance"
        );
      });
    });
    context("success", function () {
      it("batch mints", async function () {
        expect(
          await contracts.butterWhaleProcessing
            .connect(depositor)
            .mint(parseEther("10000"), 0)
        )
          .to.emit(contracts.butterWhaleProcessing, "Minted")
          .withArgs(depositor.address, parseEther("10000"));
        expect(
          await contracts.mockSetToken.balanceOf(depositor.address)
        ).to.equal(parseEther("97.560975609756097560"));
      });
    });
  });

  describe("redeeming", function () {
    beforeEach(async function () {
      await contracts.mockSetToken.mint(depositor.address, parseEther("100"));
      await contracts.mockSetToken
        .connect(depositor)
        .approve(contracts.butterWhaleProcessing.address, parseEther("100"));
    });
    context("reverts", function () {
      it("reverts when slippage is too high", async function () {
        await expectRevert(
          contracts.butterWhaleProcessing
            .connect(depositor)
            .redeem(parseEther("100"), parseEther("10000")),
          "slippage too high"
        );
      });
      it("reverts when user balance is too small", async function () {
        await expectRevert(
          contracts.butterWhaleProcessing
            .connect(depositor)
            .redeem(parseEther("999990"), 0),
          "insufficient balance"
        );
      });
    });
    context("success", function () {
      it("batch redeems", async function () {
        expect(
          await contracts.butterWhaleProcessing
            .connect(depositor)
            .redeem(parseEther("100"), 0)
        )
          .to.emit(contracts.butterWhaleProcessing, "Redeemed")
          .withArgs(depositor.address, parseEther("100"));
        expect(await contracts.mock3Crv.balanceOf(depositor.address)).to.equal(
          parseEther("109990")
        );
      });
    });
  });
  context("zapping", function () {
    context("zapMint", function () {
      it("zap mints", async () => {
        const oldBal = await contracts.mockSetToken.balanceOf(
          depositor.address
        );
        expect(
          await contracts.butterWhaleProcessing
            .connect(depositor)
            .zapMint([parseEther("10000"), 0, 0], 0, 0)
        )
          .to.emit(contracts.butterWhaleProcessing, "ZapMinted")
          .withArgs(depositor.address, parseEther("10000"));

        expect(
          await contracts.mockSetToken.balanceOf(depositor.address)
        ).to.equal(oldBal.add(parseEther("97.560975609756097560")));
      });
      it("reverts when slippage is too high", async function () {
        await expectRevert(
          contracts.butterWhaleProcessing
            .connect(depositor)
            .zapMint([parseEther("10000"), 0, 0], 0, parseEther("100000")),
          "slippage too high"
        );
      });
      it("reverts when user balance is too small", async () => {
        await expectRevert(
          contracts.butterWhaleProcessing
            .connect(depositor)
            .zapMint([0, 0, parseEther("10000")], 0, 0),
          "ERC20: transfer amount exceeds balance"
        );
      });
    });
    context("zapRedeem", function () {
      beforeEach(async function () {
        await contracts.mockSetToken.mint(depositor.address, parseEther("100"));
        await contracts.mockSetToken
          .connect(depositor)
          .approve(contracts.butterWhaleProcessing.address, parseEther("100"));
      });
      it("zap redeems", async () => {
        const oldBal = await contracts.mockUSDC.balanceOf(depositor.address);
        expect(
          await contracts.butterWhaleProcessing
            .connect(depositor)
            .zapRedeem(parseEther("100"), 1, 0, 0)
        )
          .to.emit(contracts.butterWhaleProcessing, "ZapRedeemed")
          .withArgs(depositor.address, parseEther("100"));

        expect(await contracts.mockUSDC.balanceOf(depositor.address)).to.equal(
          oldBal.add(parseEther("9980.01"))
        );
      });
      it("reverts when slippage is too high", async function () {
        await expectRevert(
          contracts.butterWhaleProcessing
            .connect(depositor)
            .zapRedeem(parseEther("100"), 1, 0, parseEther("1000000")),
          "slippage too high"
        );
      });
      it("reverts when user balance is too small", async () => {
        await expectRevert(
          contracts.butterWhaleProcessing
            .connect(depositor)
            .zapRedeem(parseEther("1000000"), 1, 0, 0),
          "insufficient balance"
        );
      });
    });
  });

  context("paused", function () {
    beforeEach(async function () {
      await contracts.butterWhaleProcessing.connect(owner).pause();
    });
    it("prevents mint", async function () {
      await expectRevert(
        contracts.butterWhaleProcessing
          .connect(depositor)
          .mint(parseEther("1"), 0),
        "Pausable: paused"
      );
    });
    it("prevents redeem", async function () {
      await expectRevert(
        contracts.butterWhaleProcessing
          .connect(depositor)
          .redeem(parseEther("1"), 0),
        "Pausable: paused"
      );
    });
    it("prevents zapMint", async function () {
      await expectRevert(
        contracts.butterWhaleProcessing
          .connect(depositor)
          .zapMint([parseEther("1"), 0, 0], 0, 0),
        "Pausable: paused"
      );
    });
    it("prevents zapRedeem", async function () {
      await expectRevert(
        contracts.butterWhaleProcessing
          .connect(depositor)
          .zapRedeem(parseEther("1"), 0, 0, 0),
        "Pausable: paused"
      );
    });
  });
});
