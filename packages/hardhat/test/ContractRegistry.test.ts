import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Contract } from "ethers";
import { ethers } from "hardhat";
import { DAO_ROLE } from "../lib/acl/roles";
import { expectDeepValue, expectEvent, expectRevert, expectValue } from "../lib/utils/expectValue";
import { ACLRegistry } from "../typechain";
import { ContractRegistry } from "../typechain/ContractRegistry";

let admin: SignerWithAddress, other: SignerWithAddress;

let contractRegistry: ContractRegistry;
let aclRegistry: ACLRegistry;
let otherContract: Contract;
let otherContractUpdated: Contract;

describe("ContractRegistry", () => {
  beforeEach(async () => {
    [admin, other] = await ethers.getSigners();

    aclRegistry = await (await ethers.getContractFactory("ACLRegistry")).deploy();
    await aclRegistry.deployed();

    contractRegistry = (await (
      await ethers.getContractFactory("ContractRegistry")
    ).deploy(aclRegistry.address)) as ContractRegistry;
    contractRegistry.deployed();

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    otherContract = await (await MockERC20.deploy("POP", "POP", 18)).deployed();
    otherContractUpdated = await (await MockERC20.deploy("POPV2", "POPV2", 18)).deployed();

    await aclRegistry.connect(admin).grantRole(DAO_ROLE, admin.address);
  });
  it("constructs with the right parameter", async () => {
    expectValue(await contractRegistry.aclRegistry(), aclRegistry.address);
    expectDeepValue(await contractRegistry.contracts(ethers.utils.id("ACLRegistry")), [
      aclRegistry.address,
      ethers.utils.id("1"),
    ]);
    expectDeepValue(await contractRegistry.getContractNames(), [ethers.utils.id("ACLRegistry")]);
  });
  context("adding a new contract", function () {
    it("adds a new contract", async () => {
      expectEvent(
        await contractRegistry
          .connect(admin)
          .addContract(ethers.utils.id("POP"), otherContract.address, ethers.utils.id("1")),
        contractRegistry,
        "ContractAdded",
        [ethers.utils.id("POP"), otherContract.address, ethers.utils.id("1")]
      );
      expectDeepValue(await contractRegistry.contracts(ethers.utils.id("POP")), [
        otherContract.address,
        ethers.utils.id("1"),
      ]);
      expectDeepValue(await contractRegistry.getContractNames(), [
        ethers.utils.id("ACLRegistry"),
        ethers.utils.id("POP"),
      ]);
      expectDeepValue(
        [await contractRegistry.getContractIdFromAddress(otherContract.address)],
        [ethers.utils.id("POP")]
      );
    });
    it("reverts if the contract name already exists", async () => {
      await contractRegistry
        .connect(admin)
        .addContract(ethers.utils.id("POP"), otherContract.address, ethers.utils.id("1"));
      await expectRevert(
        contractRegistry
          .connect(admin)
          .addContract(ethers.utils.id("POP"), otherContract.address, ethers.utils.id("1")),
        "contract already exists"
      );
    });
    it("reverts if the contract address already exists even if name differs", async () => {
      await contractRegistry
        .connect(admin)
        .addContract(ethers.utils.id("POP"), otherContract.address, ethers.utils.id("1"));
      await expectRevert(
        contractRegistry
          .connect(admin)
          .addContract(ethers.utils.id("POP Fake Name"), otherContract.address, ethers.utils.id("1")),
        "contract address already in use"
      );
    });
    it("reverts if its not called by the DAO", async () => {
      await expectRevert(
        contractRegistry
          .connect(other)
          .addContract(ethers.utils.id("POP"), otherContract.address, ethers.utils.id("1")),
        "you dont have the right role"
      );
    });
  });
  context("updating a contract", function () {
    it("updates an existing contract", async () => {
      await contractRegistry
        .connect(admin)
        .addContract(ethers.utils.id("POP"), otherContract.address, ethers.utils.id("1"));
      expectDeepValue(
        [await contractRegistry.getContractIdFromAddress(otherContract.address)],
        [ethers.utils.id("POP")]
      );
      expectEvent(
        await contractRegistry
          .connect(admin)
          .updateContract(ethers.utils.id("POP"), otherContractUpdated.address, ethers.utils.id("2")),
        contractRegistry,
        "ContractUpdated",
        [ethers.utils.id("POP"), otherContractUpdated.address, ethers.utils.id("2")]
      );
      expectDeepValue(await contractRegistry.contracts(ethers.utils.id("POP")), [
        otherContractUpdated.address,
        ethers.utils.id("2"),
      ]);
      expectDeepValue(await contractRegistry.getContractNames(), [
        ethers.utils.id("ACLRegistry"),
        ethers.utils.id("POP"),
      ]);

      expectDeepValue(
        [await contractRegistry.getContractIdFromAddress(otherContractUpdated.address)],
        [ethers.utils.id("POP")]
      );
      expectDeepValue(
        [await contractRegistry.getContractIdFromAddress(otherContract.address)],
        ["0x0000000000000000000000000000000000000000000000000000000000000000"]
      );
    });
    it("reverts if the contract doesnt exists", async () => {
      await expectRevert(
        contractRegistry
          .connect(admin)
          .updateContract(ethers.utils.id("POP"), otherContractUpdated.address, ethers.utils.id("2")),
        "contract doesnt exist"
      );
    });
    it("reverts if the new addresses is already registered", async () => {
      await contractRegistry
        .connect(admin)
        .addContract(ethers.utils.id("POP"), otherContract.address, ethers.utils.id("1"));
      await contractRegistry
        .connect(admin)
        .addContract(ethers.utils.id("POP 2"), otherContractUpdated.address, ethers.utils.id("1"));
      await expectRevert(
        contractRegistry.connect(admin).updateContract(
          ethers.utils.id("POP 2"),
          otherContract.address, // using an address that is already registered
          ethers.utils.id("2")
        ),
        "contract address already in use"
      );
    });
    it("reverts if its not called by the DAO", async () => {
      await contractRegistry
        .connect(admin)
        .addContract(ethers.utils.id("POP"), otherContract.address, ethers.utils.id("1"));
      await expectRevert(
        contractRegistry
          .connect(other)
          .updateContract(ethers.utils.id("POP"), otherContractUpdated.address, ethers.utils.id("2")),
        "you dont have the right role"
      );
    });
  });
  context("deleting a contract", function () {
    it("deletes a contract", async () => {
      await contractRegistry
        .connect(admin)
        .addContract(ethers.utils.id("POP"), otherContract.address, ethers.utils.id("1"));
      expectDeepValue(
        [await contractRegistry.getContractIdFromAddress(otherContract.address)],
        [ethers.utils.id("POP")]
      );
      expectEvent(
        await contractRegistry.connect(admin).deleteContract(ethers.utils.id("POP"), 1),
        contractRegistry,
        "ContractDeleted",
        [ethers.utils.id("POP")]
      );
      expectDeepValue(await contractRegistry.contracts(ethers.utils.id("POP")), [
        "0x0000000000000000000000000000000000000000",
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      ]);
      expectDeepValue(await contractRegistry.getContractNames(), [
        ethers.utils.id("ACLRegistry"),
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      ]);
      expectDeepValue(
        [await contractRegistry.getContractIdFromAddress(otherContract.address)],
        ["0x0000000000000000000000000000000000000000000000000000000000000000"]
      );
    });
    it("reverts if the contract doesnt exists", async () => {
      await expectRevert(
        contractRegistry.connect(admin).deleteContract(ethers.utils.id("ContractToDelete"), 1),
        "contract doesnt exist"
      );
    });
    it("reverts if the index for `contractName` doesnt match they contract name", async () => {
      await contractRegistry
        .connect(admin)
        .addContract(ethers.utils.id("POP"), otherContract.address, ethers.utils.id("1"));
      await expectRevert(
        contractRegistry.connect(admin).deleteContract(ethers.utils.id("POP"), 0),
        "this is not the contract you are looking for"
      );
    });
    it("reverts if its not called by the DAO", async () => {
      await contractRegistry
        .connect(admin)
        .addContract(ethers.utils.id("POP"), otherContract.address, ethers.utils.id("1"));
      await expectRevert(
        contractRegistry.connect(other).deleteContract(ethers.utils.id("POP"), 1),
        "you dont have the right role"
      );
    });
  });
  context("getContract", function () {
    it("returns a contract address by contract name", async () => {
      expectValue(await contractRegistry.getContract(ethers.utils.id("ACLRegistry")), aclRegistry.address);
    });
    it("returns a contract address by contract address", async () => {
      expectValue(await contractRegistry.getContractIdFromAddress(aclRegistry.address), ethers.utils.id("ACLRegistry"));
    });
  });
});
