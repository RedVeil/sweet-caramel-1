import axios from "axios";
import { Signer } from "ethers/lib/ethers";
import { parseUnits } from "ethers/lib/utils";
import { ethers, network } from "hardhat";

import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import { Zapper } from "../../../lib/adapters/Zapper";
import { expectValue } from "../../../lib/utils/expectValue";
import { impersonateSigner } from "../../../lib/utils/test";
import { ERC20, VaultsV1Zapper, } from "../../../typechain";
import { accounts, Contracts, deployContracts } from "./forkTestHelper";

const ETH_ADDRESS = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
const SETH_ADDRESS = "0x5e74C9036fb86BD7eCdcb084a0673EFc32eA31cb";
const DAI_ADDRESS = "0x6B175474E89094C44Da98b954EedeAC495271d0F";

const TRI_CRYPTO_ASSET = "0xc4AD29ba4B3c580e6D59105FFf484999997675Ff";
const TRI_CRYPTO_POOL = "0xD51a44d3FaE010294C616388b506AcdA1bfAAE46";
const USDT_ADDRESS = "0xdAC17F958D2ee523a2206206994597C13D831ec7";

interface ZapperModuleContracts extends Contracts {
  zeroXZapper?: VaultsV1Zapper;
  seth?: ERC20;
  dai?: ERC20;
  usdt?: ERC20;
}

let owner: SignerWithAddress;
let contracts: ZapperModuleContracts;
let zapper: Zapper;
let dao: Signer;

describe("Tri Crypto Zapper Test", function () {
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
    contracts = await deployContracts(TRI_CRYPTO_ASSET);

    contracts.seth = (await ethers.getContractAt(
      "@openzeppelin/contracts/token/ERC20/ERC20.sol:ERC20",
      SETH_ADDRESS
    )) as ERC20;

    contracts.dai = (await ethers.getContractAt(
      "@openzeppelin/contracts/token/ERC20/ERC20.sol:ERC20",
      DAI_ADDRESS
    )) as ERC20;

    contracts.usdt = (await ethers.getContractAt(
      "@openzeppelin/contracts/token/ERC20/ERC20.sol:ERC20",
      USDT_ADDRESS
    )) as ERC20;

    await contracts.faucet.sendTokens(DAI_ADDRESS, 10, owner.address);
    await contracts.faucet.sendTokens(USDT_ADDRESS, 10, owner.address);
    await contracts.faucet.sendCrv3CryptoLPTokens(10, owner.address);

    const ZeroXZapper = await ethers.getContractFactory("VaultsV1Zapper");
    contracts.zeroXZapper = await ZeroXZapper.deploy(contracts.contractRegistry.address) as VaultsV1Zapper

    dao = await impersonateSigner("0x92a1cB552d0e177f3A135B4c87A4160C8f2a485f");

    const aclRegistry = await ethers.getContractAt("ACLRegistry", accounts.aclRegistry);
    await aclRegistry.connect(dao).grantRole(await aclRegistry.APPROVED_CONTRACT_ROLE(), contracts.zeroXZapper.address);

    await contracts.zeroXZapper.connect(dao).updateVault(contracts.asset.address, contracts.vault.address);
    await contracts.zeroXZapper
      .connect(dao)
      .updateZaps(
        contracts.asset.address,
        "0x5Ce9b49B7A1bE9f2c3DC2B2A5BaCEA56fa21FBeE",
        "0xE03A338d5c305613AfC3877389DD3B0617233387"
      );

    zapper = new Zapper(axios, contracts.zeroXZapper);

    await contracts.dai.approve(contracts.zeroXZapper.address, ethers.constants.MaxUint256);
    await contracts.seth.approve(contracts.zeroXZapper.address, ethers.constants.MaxUint256);
    await contracts.vault.approve(contracts.zeroXZapper.address, ethers.constants.MaxUint256);
    await contracts.vault.approve(contracts.vault.address, ethers.constants.MaxUint256);
  });

  it("should deposit directly into the vault", async () => {
    const vaultBal = await contracts.vault.balanceOf(owner.address);
    const assetBal = await contracts.asset.balanceOf(owner.address);

    await contracts.asset.connect(owner).approve(contracts.vault.address, parseUnits("5"));

    await contracts.vault.connect(owner)["deposit(uint256)"](parseUnits("5"));

    await expectValue((await contracts.vault.balanceOf(owner.address)).gt(vaultBal), true);
    await expectValue((await contracts.asset.balanceOf(owner.address)).lt(assetBal), true);
  });

  it("should redeem directly from the vault", async () => {
    await contracts.asset.connect(owner).approve(contracts.vault.address, parseUnits("5"));
    await contracts.vault.connect(owner)["deposit(uint256)"](parseUnits("5"));

    const vaultBal = await contracts.vault.balanceOf(owner.address);
    const assetBal = await contracts.asset.balanceOf(owner.address);

    await contracts.vault["redeem(uint256,address,address)"](vaultBal, owner.address, owner.address);

    await expectValue((await contracts.vault.balanceOf(owner.address)).lt(vaultBal), true);
    await expectValue((await contracts.asset.balanceOf(owner.address)).gt(assetBal), true);
  });

  it("zapIn should swap to the underlying asset and deposit into the vault", async () => {
    const vaultBal = await contracts.vault.balanceOf(owner.address);
    const daiBal = await contracts.dai.balanceOf(owner.address);

    await zapper.zapIn(
      { address: contracts.dai.address, decimals: 18 },
      contracts.vault,
      TRI_CRYPTO_POOL,
      parseUnits("1"),
      0.03,
      false
    );
    await expectValue((await contracts.vault.balanceOf(owner.address)).gt(vaultBal), true);
    await expectValue((await contracts.dai.balanceOf(owner.address)).lt(daiBal), true);
  });

  it("zapIn with Underlying should deposit into the vault", async () => {
    const vaultBal = await contracts.vault.balanceOf(owner.address);
    const ethBal = await owner.getBalance();

    await zapper.zapIn(
      { address: ETH_ADDRESS, decimals: 18 },
      contracts.vault,
      TRI_CRYPTO_POOL,
      parseUnits("1"),
      0.03,
      false
    );

    await expectValue((await contracts.vault.balanceOf(owner.address)).gt(vaultBal), true);
    await expectValue((await owner.getBalance()).lt(ethBal), true);
  });

  it("zapOut should withdraw and swap into stable", async () => {
    await zapper.zapIn(
      { address: contracts.dai.address, decimals: 18 },
      contracts.vault,
      TRI_CRYPTO_POOL,
      parseUnits("2000"),
      0.03,
      false
    );
    const vaultBal = await contracts.vault.balanceOf(owner.address);
    const daiBal = await contracts.dai.balanceOf(owner.address);

    await zapper.zapOut(
      { address: contracts.dai.address, decimals: 18 },
      contracts.vault,
      TRI_CRYPTO_POOL,
      vaultBal,
      1,
      false
    );
    await expectValue((await contracts.vault.balanceOf(owner.address)).lt(vaultBal), true);
    await expectValue((await contracts.dai.balanceOf(owner.address)).gt(daiBal), true);
  });

  it("zapOut should withdraw underlying asset", async () => {
    await zapper.zapIn(
      { address: contracts.dai.address, decimals: 18 },
      contracts.vault,
      TRI_CRYPTO_POOL,
      parseUnits("2000"),
      0.03,
      false
    );
    const vaultBal = await contracts.vault.balanceOf(owner.address);
    const ethBal = await owner.getBalance();

    await zapper.zapOut(
      { address: ETH_ADDRESS, decimals: 18 },
      contracts.vault,
      TRI_CRYPTO_POOL,
      vaultBal,
      0.03,
      false
    );

    await expectValue((await contracts.vault.balanceOf(owner.address)).lt(vaultBal), true);
    await expectValue((await owner.getBalance()).gt(ethBal), true);
  });
});
