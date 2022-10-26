import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

let owner: SignerWithAddress;

// we only need the aggregate function and the Created event from the multicall contract
const DS_PROXY_FACTORY_ABI = [
  "function build() public returns (address payable proxy)",
  "event Created(address indexed sender, address indexed owner, address proxy, address cache)",
];

describe("Vault", async () => {
  beforeEach(async () => {
    [owner] = await ethers.getSigners();

    const proxyFactoryFactory = await ethers.getContractFactory("DSProxyFactory");
    var proxyFactoryA = await (await proxyFactoryFactory.deploy()).deployed();
    var proxyFactory = await ethers.getContractAt(DS_PROXY_FACTORY_ABI, proxyFactoryA.address);
    const tx = await proxyFactory.connect(owner).build();
    const txReceipt = await tx.wait(1);

    const event = txReceipt.events.find((event) => event.event === "Created");
    const [, , proxy] = event.args;
    console.log(proxy);
  });

  it("deposit + stake", async () => {
    console.log("sss");
  });
});
