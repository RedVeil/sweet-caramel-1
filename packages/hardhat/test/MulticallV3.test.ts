import { expect } from "chai";
import { ethers } from "hardhat";
import { parseEther } from "ethers/lib/utils";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Contracts, deployContracts } from "./MulticallTestHelper";
import {
  getTransferFromEncoding,
  getStakeForEncoding,
  getDepositEncoding,
  getApproveEncoding,
} from "../../utils/src/functionEncodings";
import { Contract } from "packages/utils/node_modules/ethers/lib";

let owner: SignerWithAddress,
  depositor: SignerWithAddress,
  depositor2: SignerWithAddress,
  receiver: SignerWithAddress,
  rewardsManager: SignerWithAddress,
  zapper: SignerWithAddress;
let contracts: Contracts;
let multicall: Contract;

// we only need aggregate from the multicall contract
const MULTICALLV3_ABI = [
  {
    inputs: [
      {
        components: [
          { internalType: "address", name: "target", type: "address" },
          { internalType: "bytes", name: "callData", type: "bytes" },
        ],
        internalType: "struct Multicall3.Call[]",
        name: "calls",
        type: "tuple[]",
      },
    ],
    name: "aggregate",
    outputs: [
      { internalType: "uint256", name: "blockNumber", type: "uint256" },
      { internalType: "bytes[]", name: "returnData", type: "bytes[]" },
    ],
    stateMutability: "payable",
    type: "function",
  },
];

// on every chain the same
const MULTICALLV3_CONTRACT = "0xcA11bde05977b3631167028862bE2a173976CA11";

describe("Vault", async () => {
  beforeEach(async () => {
    [owner, depositor, depositor2, receiver, rewardsManager, zapper] = await ethers.getSigners();
    contracts = await deployContracts(owner, rewardsManager);
    multicall = await ethers.getContractAt(MULTICALLV3_ABI, MULTICALLV3_CONTRACT, owner);
  });

  it("deposit + stake", async () => {
    const DEPOSIT_AMOUNT = parseEther("100");

    // mint the assets (underlying to the vault) to the owner, so he has something to deposit
    await contracts.depositToken.mint(owner.address, DEPOSIT_AMOUNT);

    // approve the multicall to spend the tokens of the owner
    // WARNING: this is a big security risk!! anyone can call multicall with custom code and steal funds
    await contracts.depositToken.connect(owner).approve(multicall.address, DEPOSIT_AMOUNT);

    await multicall.aggregate([
      // 1) transfer tokens from owner to multicall contract
      [contracts.depositToken.address, getTransferFromEncoding(owner.address, multicall.address, DEPOSIT_AMOUNT)],
      // 2) approve the vault to spend the tokens of the multicall contract
      [contracts.depositToken.address, getApproveEncoding(contracts.vault.address, DEPOSIT_AMOUNT)],
      // 3) deposit multicall tokens in vault
      [contracts.vault.address, getDepositEncoding(DEPOSIT_AMOUNT, multicall.address)],
      // 4) approve the staking contract to spend the vault shares of the multicall contract
      [contracts.vault.address, getApproveEncoding(contracts.staking.address, DEPOSIT_AMOUNT)],
      // 5) stake vault shares of the multicall contract in staking contract
      [contracts.staking.address, getStakeForEncoding(DEPOSIT_AMOUNT, owner.address)],
    ]);

    // the owner should have his staking tokens
    var balanceOfOwner = await contracts.staking.balanceOf(owner.address);
    expect(parseInt(balanceOfOwner._hex)).to.equal(parseInt(DEPOSIT_AMOUNT._hex));

    // the multicall should have no staking tokens
    var balanceOfMulticall = await contracts.staking.balanceOf(multicall.address);
    expect(parseInt(balanceOfMulticall._hex)).to.equal(0);
  });

  it("unstake + deposit", async () => {});

  it("zap + stake", async () => {});

  it("unstake + zap", async () => {});
});
