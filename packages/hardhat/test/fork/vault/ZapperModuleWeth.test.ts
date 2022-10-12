import axios from "axios";
import { Signer } from "ethers/lib/ethers";
import { parseUnits } from "ethers/lib/utils";
import { ethers, network } from "hardhat";

import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { constants } from "ethers/lib/ethers";
import { Zapper } from "../../../lib/adapters/Zapper";
import { expectValue } from "../../../lib/utils/expectValue";
import { impersonateSigner } from "../../../lib/utils/test";
import { accounts, Contracts, deployContracts } from "./forkTestHelper";
import { VaultsV1Zapper } from "packages/hardhat/typechain/VaultsV1Zapper";
import { ERC20, IWETH } from "packages/hardhat/typechain";
import { IWETH__factory } from "@popcorn/hardhat/typechain";

const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
const DAI_ADDRESS = "0x6B175474E89094C44Da98b954EedeAC495271d0F";

interface ZapperModuleContracts extends Contracts {
  vaultsV1Zapper?: VaultsV1Zapper;
  seth?: ERC20;
  dai?: ERC20;
}

let owner: SignerWithAddress;
let contracts: ZapperModuleContracts;
let zapper: Zapper;
let dao: Signer;

describe("WETH SwapZapper Test", function () {
  beforeEach(async function () {
    await network.provider.request({
      method: "hardhat_reset",
      params: [
        {
          forking: {
            jsonRpcUrl: process.env.FORKING_RPC_URL,
          },
        },
      ],
    });
    [owner] = await ethers.getSigners();
    contracts = await deployContracts(WETH);

    contracts.dai = (await ethers.getContractAt(
      "@openzeppelin/contracts/token/ERC20/ERC20.sol:ERC20",
      DAI_ADDRESS
    )) as ERC20;

    await contracts.faucet.sendTokens(DAI_ADDRESS, 10, owner.address);
    const weth = (await IWETH__factory.connect(WETH, owner)) as IWETH;
    await weth.deposit({ value: 10 });

    const VaultsV1Zapper = await ethers.getContractFactory("VaultsV1Zapper");
    contracts.vaultsV1Zapper = (await VaultsV1Zapper.deploy(contracts.contractRegistry.address)) as VaultsV1Zapper;

    const SwapZapIn = await ethers.getContractFactory("ZeroXSwapZapIn");
    const swapZapIn = await SwapZapIn.deploy();
    const SwapZapOut = await ethers.getContractFactory("ZeroXSwapZapOut");
    const swapZapOut = await SwapZapOut.deploy();

    dao = await impersonateSigner("0x92a1cB552d0e177f3A135B4c87A4160C8f2a485f");

    const aclRegistry = await ethers.getContractAt("ACLRegistry", accounts.aclRegistry);
    await aclRegistry
      .connect(dao)
      .grantRole(await aclRegistry.APPROVED_CONTRACT_ROLE(), contracts.vaultsV1Zapper.address);

    await contracts.vaultsV1Zapper.connect(dao).updateVault(contracts.asset.address, contracts.vault.address);
    await contracts.vaultsV1Zapper
      .connect(dao)
      .updateZaps(contracts.asset.address, swapZapIn.address, swapZapOut.address);

    zapper = new Zapper(axios, contracts.vaultsV1Zapper);

    await contracts.dai.approve(contracts.vaultsV1Zapper.address, ethers.constants.MaxUint256);
    await contracts.vault.approve(contracts.vaultsV1Zapper.address, ethers.constants.MaxUint256);
  });

  it("SwapZapper Swaps WETH for ETH", async () => {
    await zapper.zapIn(
      { address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", decimals: 18 },
      contracts.vault,
      WETH,
      parseUnits("1"),
      0,
      false
    );

    const wethBal = await contracts.vault.balanceOf(owner.address);
    const ethBal = await owner.getBalance();

    await zapper.zapOut(
      { address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", decimals: 18 },
      contracts.vault,
      WETH,
      wethBal,
      0,
      false
    );
    const wethBalAfter = await contracts.vault.balanceOf(owner.address);
    const ethBalAfter = await owner.getBalance();
    expectValue(wethBalAfter.lt(wethBal), true);
    expectValue(ethBalAfter.gt(ethBal), true);
  });

  it("SwapZapper Swaps ETH for WETH", async () => {
    const wethBal = await contracts.vault.balanceOf(owner.address);
    const ethBal = await owner.getBalance();

    await zapper.zapIn(
      { address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", decimals: 18 },
      contracts.vault,
      WETH,
      parseUnits("1"),
      0,
      false
    );

    const wethBalAfter = await contracts.vault.balanceOf(owner.address);
    const ethBalAfter = await owner.getBalance();

    expectValue(wethBalAfter.gt(wethBal), true);
    expectValue(ethBalAfter.lt(ethBal), true);
  });
});
