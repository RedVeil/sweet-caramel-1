import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { parseEther } from "ethers/lib/utils";
import { ethers } from "hardhat";
import { ACLRegistry, ContractRegistry, VaultFeeController } from "../typechain";
import { expectValue, expectEvent, expectRevert } from "../lib/utils/expectValue";

interface Contracts {
  aclRegistry: ACLRegistry;
  contractRegistry: ContractRegistry;
  vaultFeeController: VaultFeeController;
}

let owner: SignerWithAddress, nonOwner: SignerWithAddress, feeRecipient: SignerWithAddress;
let contracts: Contracts;

const FEE_MULTIPLIER = parseEther("0.0001"); // 1e14
const INITIAL_FEES = {
  deposit: 0,
  withdrawal: FEE_MULTIPLIER.mul(50),
  management: FEE_MULTIPLIER.mul(200),
  performance: FEE_MULTIPLIER.mul(2000),
};

async function deployContracts(): Promise<Contracts> {
  const aclRegistry = await (await (await ethers.getContractFactory("ACLRegistry")).deploy()).deployed();

  const contractRegistry = await (
    await (await ethers.getContractFactory("ContractRegistry")).deploy(aclRegistry.address)
  ).deployed();

  const vaultFeeController = await (
    await (await ethers.getContractFactory("VaultFeeController")).deploy(INITIAL_FEES, contractRegistry.address)
  ).deployed();

  await aclRegistry.grantRole(ethers.utils.id("DAO"), owner.address);
  await contractRegistry
    .connect(owner)
    .addContract(ethers.utils.id("VaultFeeController"), vaultFeeController.address, ethers.utils.id("1"));

  return {
    aclRegistry,
    contractRegistry,
    vaultFeeController,
  };
}

describe("VaultFeeController", function () {
  beforeEach(async function () {
    [owner, nonOwner, feeRecipient] = await ethers.getSigners();
    contracts = await deployContracts();
  });

  describe("constructor", async function () {
    it("sets fee structure at construction time", async function () {
      await expectValue(await contracts.vaultFeeController.getDepositFee(), 0);
      await expectValue(await contracts.vaultFeeController.getWithdrawalFee(), FEE_MULTIPLIER.mul(50));
      await expectValue(await contracts.vaultFeeController.getManagementFee(), FEE_MULTIPLIER.mul(200));
      await expectValue(await contracts.vaultFeeController.getPerformanceFee(), FEE_MULTIPLIER.mul(2000));
    });
  });

  describe("setFeeRecipient", async function () {
    it("updates fee recipient", async function () {
      await expectValue(await contracts.vaultFeeController.feeRecipient(), ethers.constants.AddressZero);
      await contracts.vaultFeeController.connect(owner).setFeeRecipient(feeRecipient.address);
      await expectValue(await contracts.vaultFeeController.feeRecipient(), feeRecipient.address);
    });

    it("emits FeeRecipientChanged", async function () {
      await expectEvent(
        await contracts.vaultFeeController.connect(owner).setFeeRecipient(feeRecipient.address),
        contracts.vaultFeeController,
        "FeeRecipientChanged",
        [ethers.constants.AddressZero, feeRecipient.address]
      );
    });

    it("reverts on unauthorized caller", async function () {
      await expectRevert(
        contracts.vaultFeeController.connect(nonOwner).setFeeRecipient(feeRecipient.address),
        "you dont have the right role"
      );
    });
  });

  describe("setFees", async function () {
    const NEW_FEES = {
      deposit: FEE_MULTIPLIER.mul(10),
      withdrawal: FEE_MULTIPLIER.mul(100),
      management: FEE_MULTIPLIER.mul(400),
      performance: FEE_MULTIPLIER.mul(4000),
    };

    it("updates fee structure", async function () {
      await contracts.vaultFeeController.connect(owner).setFees(NEW_FEES);
      await expectValue(await contracts.vaultFeeController.getDepositFee(), NEW_FEES.deposit);
      await expectValue(await contracts.vaultFeeController.getWithdrawalFee(), NEW_FEES.withdrawal);
      await expectValue(await contracts.vaultFeeController.getManagementFee(), NEW_FEES.management);
      await expectValue(await contracts.vaultFeeController.getPerformanceFee(), NEW_FEES.performance);
    });

    it("emits FeesChanged", async function () {
      await expectEvent(
        await contracts.vaultFeeController.connect(owner).setFees(NEW_FEES),
        contracts.vaultFeeController,
        "FeesChanged",
        [
          [INITIAL_FEES.deposit, INITIAL_FEES.withdrawal, INITIAL_FEES.management, INITIAL_FEES.performance],
          [NEW_FEES.deposit, NEW_FEES.withdrawal, NEW_FEES.management, NEW_FEES.performance],
        ]
      );
    });

    it("reverts on unauthorized caller", async function () {
      await expectRevert(
        contracts.vaultFeeController.connect(nonOwner).setFees(NEW_FEES),
        "you dont have the right role"
      );
    });

    it("reverts on invalid deposit fee", async function () {
      NEW_FEES.deposit = parseEther("1");
      await expectRevert(contracts.vaultFeeController.connect(owner).setFees(NEW_FEES), "Invalid FeeStructure");
    });

    it("reverts on invalid withdrawal fee", async function () {
      NEW_FEES.withdrawal = parseEther("1");
      await expectRevert(contracts.vaultFeeController.connect(owner).setFees(NEW_FEES), "Invalid FeeStructure");
    });

    it("reverts on invalid performance fee", async function () {
      NEW_FEES.performance = parseEther("1");
      await expectRevert(contracts.vaultFeeController.connect(owner).setFees(NEW_FEES), "Invalid FeeStructure");
    });

    it("reverts on invalid management fee", async function () {
      NEW_FEES.management = parseEther("1");
      await expectRevert(contracts.vaultFeeController.connect(owner).setFees(NEW_FEES), "Invalid FeeStructure");
    });
  });
});
