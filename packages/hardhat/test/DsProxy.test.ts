import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

let owner: SignerWithAddress;

// we only need the aggregate function and the Created event from the multicall contract
const DS_PROXY_FACTORY_ABI = [
  "function build() public returns (address payable proxy)",
  "event Created(address indexed sender, address indexed owner, address proxy, address cache)",
];

const DS_PROXY_ABI = [
  "function execute(address _target, bytes memory _data) public payable returns (bytes memory response)",
];

describe("Vault", async () => {
  beforeEach(async () => {
    [owner] = await ethers.getSigners();

    const pFacFac = await ethers.getContractFactory("DSProxyFactory");
    var pFacD = await (await pFacFac.deploy()).deployed();
    var pFac = await ethers.getContractAt(DS_PROXY_FACTORY_ABI, pFacD.address);

    // use the proxyFactory to create a new proxy for owner
    const tx = await pFac.connect(owner).build();
    const txReceipt = await tx.wait(1);

    // check the Created event to get the address of the new proxy
    const event = txReceipt.events.find((event) => event.event === "Created");
    const [, , pAddress] = event.args;

    var p = await ethers.getContractAt(DS_PROXY_ABI, pAddress);
    // await p.execute("", "");
  });

  it("deposit + stake", async () => {
    console.log("sss");
  });
});
