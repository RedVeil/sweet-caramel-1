import axios from "axios";
import { Signer, BigNumber } from "ethers/lib/ethers";
import { parseUnits } from "ethers/lib/utils";
import { ethers, network } from "hardhat";

import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { constants } from "ethers/lib/ethers";
import { Zapper } from "../../../lib/adapters/Zapper";
import { expectValue } from "../../../lib/utils/expectValue";
import { impersonateSigner } from "../../../lib/utils/test";
import { accounts, Contracts, deployContracts } from "./forkTestHelper";
import { VaultsV1Zapper } from "packages/hardhat/typechain/VaultsV1Zapper";
import { ERC20 } from "packages/hardhat/typechain";

const ETH_ADDRESS = ethers.constants.AddressZero;
const SETH_ADDRESS = "0x5e74C9036fb86BD7eCdcb084a0673EFc32eA31cb";
const DAI_ADDRESS = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
const SETH_POOL = "0xc5424B857f758E906013F3555Dad202e4bdB4567";

interface ZapperModuleContracts extends Contracts {
  zeroXZapper?: VaultsV1Zapper;
  seth?: ERC20;
  dai?: ERC20;
}

let owner: SignerWithAddress;
let contracts: ZapperModuleContracts;
let zapper: Zapper;
let dao: Signer;

const USDT_ADDRESS = "0xdAC17F958D2ee523a2206206994597C13D831ec7";

describe("Stargate Zapper Test", function () {
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
    contracts = await deployContracts(USDT_ADDRESS);
    contracts.seth = (await ethers.getContractAt(
      "@openzeppelin/contracts/token/ERC20/ERC20.sol:ERC20",
      SETH_ADDRESS
    )) as ERC20;

    contracts.dai = (await ethers.getContractAt(
      "@openzeppelin/contracts/token/ERC20/ERC20.sol:ERC20",
      DAI_ADDRESS
    )) as ERC20;

    await contracts.faucet.sendTokens(DAI_ADDRESS, 10, owner.address);
    await contracts.faucet.sendTokens(USDT_ADDRESS, 10, owner.address);

    const ZeroXZapper = await ethers.getContractFactory("VaultsV1Zapper");
    contracts.zeroXZapper = (await ZeroXZapper.deploy(contracts.contractRegistry.address)) as VaultsV1Zapper;

    const SwapZapIn = await ethers.getContractFactory("ZeroXSwapZapIn");
    const swapZapIn = await SwapZapIn.deploy();
    const SwapZapOut = await ethers.getContractFactory("ZeroXSwapZapOut");
    const swapZapOut = await SwapZapOut.deploy();

    dao = await impersonateSigner("0x92a1cB552d0e177f3A135B4c87A4160C8f2a485f");

    const aclRegistry = await ethers.getContractAt("ACLRegistry", accounts.aclRegistry);
    await aclRegistry.connect(dao).grantRole(await aclRegistry.APPROVED_CONTRACT_ROLE(), contracts.zeroXZapper.address);

    await contracts.zeroXZapper.connect(dao).updateVault(contracts.asset.address, contracts.vault.address);
    await contracts.zeroXZapper.connect(dao).updateZaps(contracts.asset.address, swapZapIn.address, swapZapOut.address);

    zapper = new Zapper(axios, contracts.zeroXZapper);

    await contracts.dai.approve(contracts.zeroXZapper.address, ethers.constants.MaxUint256);
    await contracts.seth.approve(contracts.zeroXZapper.address, ethers.constants.MaxUint256);
    await contracts.vault.approve(contracts.zeroXZapper.address, ethers.constants.MaxUint256);
  });

  it("Deposit Directly", async () => {
    const vaultBal = await contracts.vault.balanceOf(owner.address);
    const usdtBalance = await contracts.asset.balanceOf(owner.address);

    await contracts.asset.approve(contracts.vault.address, BigNumber.from("20000000"));
    await contracts.vault["deposit(uint256)"](BigNumber.from("20000000"));

    expectValue((await contracts.vault.balanceOf(owner.address)).gt(vaultBal), true);
    expectValue((await contracts.asset.balanceOf(owner.address)).lt(usdtBalance), true);
  });

  it("zapIn should swap a Stable to the underlying asset and deposit into the vault", async () => {
    const vaultBal = await contracts.vault.balanceOf(owner.address);
    const daiBalance = await contracts.dai.balanceOf(owner.address);

    await zapper.zapIn(
      { address: contracts.dai.address, decimals: 18 },
      contracts.vault,
      constants.AddressZero,
      parseUnits("1"),
      0.03,
      false
    );

    expectValue((await contracts.vault.balanceOf(owner.address)).gt(vaultBal), true);
    expectValue((await contracts.dai.balanceOf(owner.address)).lt(daiBalance), true);
  });

  it("zapOut should withdraw and swap into a stable", async () => {
    await zapper.zapIn(
      { address: contracts.dai.address, decimals: 18 },
      contracts.vault,
      constants.AddressZero,
      parseUnits("200"),
      0.03,
      false
    );

    const vaultBal = await contracts.vault.balanceOf(owner.address);
    const daiBalance = await contracts.dai.balanceOf(owner.address);

    await zapper.zapOut(
      { address: contracts.dai.address, decimals: 18 },
      contracts.vault,
      constants.AddressZero,
      vaultBal,
      1,
      false
    );

    await expectValue((await contracts.vault.balanceOf(owner.address)).lt(vaultBal), true);
    await expectValue((await contracts.dai.balanceOf(owner.address)).gt(daiBalance), true);
  });

  it("zapIn should swap ETH to the underlying asset and deposit into the vault", async () => {
    const vaultBal = await contracts.vault.balanceOf(owner.address);
    const ethBal = await owner.getBalance();

    await zapper.zapIn(
      { address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", decimals: 18 },
      contracts.vault,
      constants.AddressZero,
      parseUnits("1"),
      0.03,
      false
    );

    expectValue((await contracts.vault.balanceOf(owner.address)).gt(vaultBal), true);
    expectValue((await owner.getBalance()).lt(ethBal), true);
  });

  // Not done yet
  it.skip("zapOut should withdraw and swap into ETH", async () => {
    await zapper.zapIn(
      { address: contracts.dai.address, decimals: 18 },
      contracts.vault,
      constants.AddressZero,
      parseUnits("200"),
      0.03,
      false
    );

    const vaultBal = await contracts.vault.balanceOf(owner.address);
    const ethBal = await owner.getBalance();

    await zapper.zapOut(
      { address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", decimals: 18 },
      contracts.vault,
      constants.AddressZero,
      vaultBal,
      1,
      false
    );

    await expectValue((await contracts.vault.balanceOf(owner.address)).lt(vaultBal), true);
    expectValue((await owner.getBalance()).gt(ethBal), true);
  });
});
