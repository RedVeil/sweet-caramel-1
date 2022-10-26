import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Contracts, deployContracts } from "./MulticallTestHelper";
import { parseEther } from "ethers/lib/utils";
import {
  getTransferEncoding,
  getDepositEncoding,
  getApproveEncoding,
  getTransferFromEncoding,
} from "../../utils/src/functionEncodings";

let owner: SignerWithAddress,
  depositor: SignerWithAddress,
  depositor2: SignerWithAddress,
  receiver: SignerWithAddress,
  rewardsManager: SignerWithAddress,
  zapper: SignerWithAddress;
let contracts: Contracts;

// we only need the aggregate function and the Created event from the multicall contract
const MULTI_DELEGATE_ABI = [
  "function multiDelegatecall(address[] addresses, bytes[] data) external payable returns (bytes[] memory results)",
];

describe("Vault", async () => {
  beforeEach(async () => {
    [owner, depositor, depositor2, receiver, rewardsManager, zapper] = await ethers.getSigners();
    contracts = await deployContracts(owner, rewardsManager);

    const mdFac = await ethers.getContractFactory("MultiDelegatecall");
    var mdD = await (await mdFac.deploy()).deployed();
    var md = await ethers.getContractAt(MULTI_DELEGATE_ABI, mdD.address);

    const DEPOSIT_AMOUNT = parseEther("100");

    // mint the assets (underlying to the vault) to the owner, so he has something to deposit
    await contracts.depositToken.mint(owner.address, DEPOSIT_AMOUNT);

    // approve the multicall to spend the tokens of the owner
    // WARNING: this is a big security risk!! anyone can call multicall with custom code and steal funds
    await contracts.depositToken.connect(owner).approve(md.address, DEPOSIT_AMOUNT);

    await md
      .connect(owner)
      .multiDelegatecall(
        [contracts.depositToken.address],
        [getTransferFromEncoding(owner.address, depositor.address, DEPOSIT_AMOUNT)]
      );

    // // use the proxyFactory to create a new proxy for owner
    // const tx = await pFac.connect(owner).build();
    // const txReceipt = await tx.wait(1);

    // // check the Created event to get the address of the new proxy
    // const event = txReceipt.events.find((event) => event.event === "Created");
    // const [, , pAddress] = event.args;

    // var p = await ethers.getContractAt(DS_PROXY_ABI, pAddress);
    // await p.execute("", "");
  });

  it("deposit + stake", async () => {
    console.log("sss");
  });
});
