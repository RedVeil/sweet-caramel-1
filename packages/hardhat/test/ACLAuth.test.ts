import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "hardhat";
import { expectRevert, expectValue } from "../lib/utils/expectValue";
import { ACLAuthHelper, ACLRegistry, ContractRegistry } from "../typechain";

let admin: SignerWithAddress,
  keeper: SignerWithAddress,
  dao: SignerWithAddress,
  noRole: SignerWithAddress,
  noPermissions: SignerWithAddress,
  hasTestPermission: SignerWithAddress,
  eoa: SignerWithAddress;

let aclRegistry: ACLRegistry;
let contractRegistry: ContractRegistry;
let aclAuthHelper: ACLAuthHelper;

const KEEPER_ROLE = ethers.utils.id("Keeper");
const DAO_ROLE = ethers.utils.id("DAO");
const APPROVED_CONTRACT_ROLE = ethers.utils.id("ApprovedContract");
const TEST_PERMISSION = ethers.utils.id("Test Permission");

describe("ACLAuth", () => {
  beforeEach(async () => {
    [admin, keeper, dao, noRole, noPermissions, hasTestPermission, eoa] =
      await ethers.getSigners();

    aclRegistry = (await (
      await ethers.getContractFactory("ACLRegistry")
    ).deploy()) as ACLRegistry;
    await aclRegistry.deployed();

    contractRegistry = (await (
      await ethers.getContractFactory("ContractRegistry")
    ).deploy(aclRegistry.address)) as ContractRegistry;
    await aclRegistry.deployed();

    aclAuthHelper = (await (
      await ethers.getContractFactory("ACLAuthHelper")
    ).deploy(contractRegistry.address)) as ACLAuthHelper;
    await aclAuthHelper.deployed();

    await aclRegistry.connect(admin).grantRole(KEEPER_ROLE, keeper.address);
    await expectValue(
      await aclRegistry.connect(keeper).hasRole(KEEPER_ROLE, keeper.address),
      true
    );

    await aclRegistry.connect(admin).grantRole(DAO_ROLE, dao.address);
    await expectValue(
      await aclRegistry.connect(dao).hasRole(DAO_ROLE, dao.address),
      true
    );

    await aclRegistry
      .connect(admin)
      .grantPermission(TEST_PERMISSION, hasTestPermission.address);
    await expectValue(
      await aclRegistry
        .connect(hasTestPermission)
        .hasPermission(TEST_PERMISSION, hasTestPermission.address),
      true
    );
  });

  describe("onlyRole modifier", function () {
    it("restricts access to callers with the specified role", async function () {
      await expectRevert(
        aclAuthHelper.connect(noRole).onlyKeeperModifier(),
        "you dont have the right role"
      );
      await expectRevert(
        aclAuthHelper.connect(noRole).onlyDaoModifier(),
        "you dont have the right role"
      );
    });

    it("allows access from callers with the specified role", async function () {
      await aclAuthHelper.connect(keeper).onlyKeeperModifier();
      await aclAuthHelper.connect(dao).onlyDaoModifier();
    });
  });

  describe("hasRole function", function () {
    it("returns true if address has role", async function () {
      await expectValue(
        await aclAuthHelper.connect(keeper).hasKeeperRole(),
        true
      );
    });

    it("returns false if address does not have role", async function () {
      await expectValue(
        await aclAuthHelper.connect(noRole).hasKeeperRole(),
        false
      );
    });
  });

  describe("requireRole function", function () {
    it("restricts access to callers with the specified role", async function () {
      await expectRevert(
        aclAuthHelper.connect(noRole).onlyKeeperRequireRole(),
        "you dont have the right role"
      );
      await expectRevert(
        aclAuthHelper.connect(noRole).onlyDaoRequireRole(),
        "you dont have the right role"
      );
    });

    it("allows access from callers with the specified role", async function () {
      await aclAuthHelper.connect(keeper).onlyKeeperRequireRole();
      await aclAuthHelper.connect(dao).onlyDaoRequireRole();
    });

    context("with account argument", function () {
      it("reverts if account does not have the specified role", async function () {
        await expectRevert(
          aclAuthHelper
            .connect(keeper)
            .requireKeeperRoleWithAddress(noRole.address),
          "you dont have the right role"
        );
      });

      it("allows access if account has the specified role", async function () {
        await aclAuthHelper
          .connect(keeper)
          .requireKeeperRoleWithAddress(keeper.address);
      });
    });
  });

  describe("hasPermission modifier", function () {
    it("restricts access to callers with specified permissions", async function () {
      await expectRevert(
        aclAuthHelper.connect(noPermissions).onlyTestPermissionModifier(),
        "you dont have the right permissions"
      );
    });

    it("grants access to callers with specified permissions", async function () {
      await aclAuthHelper
        .connect(hasTestPermission)
        .onlyTestPermissionModifier();
    });
  });

  describe("hasPermission function", function () {
    it("returns true if address has role", async function () {
      await expectValue(
        await aclAuthHelper.connect(hasTestPermission).hasTestPermission(),
        true
      );
    });

    it("returns false if address does not have role", async function () {
      await expectValue(
        await aclAuthHelper.connect(noPermissions).hasTestPermission(),
        false
      );
    });
  });

  describe("requirePermission function", function () {
    it("restricts access to callers with specified permissions", async function () {
      await expectRevert(
        aclAuthHelper
          .connect(noPermissions)
          .onlyTestPermissionRequirePermission(),
        "you dont have the right permissions"
      );
    });

    it("grants access to callers with specified permissions", async function () {
      await aclAuthHelper
        .connect(hasTestPermission)
        .onlyTestPermissionRequirePermission();
    });

    context("with account argument", function () {
      it("restricts access to account with specified permissions", async function () {
        await expectRevert(
          aclAuthHelper
            .connect(hasTestPermission)
            .requirePermissionWithAddress(noPermissions.address),
          "you dont have the right permissions"
        );
      });

      it("grants access to account with specified permissions", async function () {
        await aclAuthHelper
          .connect(noPermissions)
          .requirePermissionWithAddress(hasTestPermission.address);
      });
    });
  });

  describe("isApprovedContractOrEOA modifier", function () {
    it("reverts when called by a contract without the approved contract role", async function () {
      await expectRevert(
        aclAuthHelper.callOtherContractWithIsApprovedContractOrEOAModifier(),
        "Access denied for caller"
      );
    });

    it("allows calls from approved contracts", async function () {
      await aclRegistry
        .connect(admin)
        .grantRole(APPROVED_CONTRACT_ROLE, aclAuthHelper.address);
      await expectValue(
        await aclRegistry
          .connect(dao)
          .hasRole(APPROVED_CONTRACT_ROLE, aclAuthHelper.address),
        true
      );
      await aclAuthHelper.callOtherContractWithIsApprovedContractOrEOAModifier();
    });

    it("allows direct calls from EOAs", async function () {
      const otherContractAddress = await aclAuthHelper.otherContract();
      const OtherContractFactory = await ethers.getContractFactory(
        "OtherContract"
      );
      const otherContract = OtherContractFactory.attach(otherContractAddress);

      await otherContract.connect(noRole).testApprovedContractOrEOAModifier();
    });
  });

  describe("requireApprovedContractOrEOA function", function () {
    it("reverts when called by a contract without the approved contract role", async function () {
      await expectRevert(
        aclAuthHelper.callOtherContractWithRequireApprovedContractOrEOA(),
        "Access denied for caller"
      );
    });

    it("allows calls from approved contracts", async function () {
      await aclRegistry
        .connect(admin)
        .grantRole(APPROVED_CONTRACT_ROLE, aclAuthHelper.address);
      await expectValue(
        await aclRegistry
          .connect(dao)
          .hasRole(APPROVED_CONTRACT_ROLE, aclAuthHelper.address),
        true
      );
      await aclAuthHelper.callOtherContractWithRequireApprovedContractOrEOA();
    });

    it("allows direct calls from EOAs", async function () {
      const otherContractAddress = await aclAuthHelper.otherContract();
      const OtherContractFactory = await ethers.getContractFactory(
        "OtherContract"
      );
      const otherContract = OtherContractFactory.attach(otherContractAddress);

      await otherContract.connect(eoa).testApprovedContractOrEOARequire();
    });

    context("with account argument", function () {
      it("reverts when called by a contract without the approved contract role", async function () {
        await expectRevert(
          aclAuthHelper.callOtherContractWithRequireApprovedContractOrEOAWithAddress(
            aclRegistry.address
          ),
          "Access denied for caller"
        );
      });

      it("allows calls from approved contracts", async function () {
        await aclRegistry
          .connect(admin)
          .grantRole(APPROVED_CONTRACT_ROLE, aclAuthHelper.address);
        await expectValue(
          await aclRegistry
            .connect(dao)
            .hasRole(APPROVED_CONTRACT_ROLE, aclAuthHelper.address),
          true
        );
        await aclAuthHelper.callOtherContractWithRequireApprovedContractOrEOAWithAddress(
          aclAuthHelper.address
        );
      });

      it("allows direct calls from EOAs", async function () {
        const otherContractAddress = await aclAuthHelper.otherContract();
        const OtherContractFactory = await ethers.getContractFactory(
          "OtherContract"
        );
        const otherContract = OtherContractFactory.attach(otherContractAddress);

        await otherContract
          .connect(eoa)
          .testApprovedContractOrEOARequireWithAddress(eoa.address);
      });
    });
  });
});
