import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { parseEther } from "ethers/lib/utils";
import { ethers, network } from "hardhat";
import { expectBigNumberCloseTo, expectValue } from "../../../lib/utils/expectValue";
import { accounts, Contracts, deployContracts } from "./forkTestHelper";

let owner: SignerWithAddress,
  depositor: SignerWithAddress,
  alice: SignerWithAddress,
  bob: SignerWithAddress,
  rewardsManager: SignerWithAddress;
let contracts: Contracts;

describe("Popcorn Vault Network Tests", function () {
  beforeEach(async function () {
    await network.provider.request({
      method: "hardhat_reset",
      params: [
        {
          forking: {
            jsonRpcUrl: process.env.FORKING_RPC_URL,
            blockNumber: 14257470,
          },
        },
      ],
    });
    [owner, depositor, alice, bob, rewardsManager] = await ethers.getSigners();
  });

  context("ibBTC", () => {
    beforeEach(async function () {
      contracts = await deployContracts(accounts.crvIbBtc);
      await contracts.faucet.sendCrvIbBtcLPTokens(10000, depositor.address);
      await expectValue(await contracts.asset.balanceOf(depositor.address), parseEther("247.043043673806930404"));
    });

    describe("Vault token", () => {
      it("sets vault token attributes", async () => {
        await expectValue(await contracts.vault.name(), "Popcorn Curve.fi Factory BTC Metapool: ibBTC Vault");
        await expectValue(await contracts.vault.symbol(), "pop-ibbtc/sbtcCRV-f");
        await expectValue(await contracts.vault.decimals(), 18);
      });
    });

    describe("Deposits", () => {
      it("accepts deposits", async () => {
        await contracts.asset.connect(depositor).approve(contracts.vault.address, parseEther("10"));
        await contracts.vault.connect(depositor)["deposit(uint256)"](parseEther("10"));
      });

      it("multiple mints/deposits/redeems/withdraws", async () => {
        // Swap 5000 ETH for underlying asset and sanity check balance
        await contracts.faucet.sendCrvIbBtcLPTokens(5000, alice.address);
        await expectBigNumberCloseTo(
          await contracts.asset.balanceOf(alice.address),
          parseEther("33.576658490611333395")
        );
        await contracts.asset.connect(alice).approve(contracts.vault.address, ethers.constants.MaxUint256);

        // Swap 2500 ETH for underlying asset and sanity check balance
        await contracts.faucet.sendCrvIbBtcLPTokens(2500, bob.address);
        await expectBigNumberCloseTo(await contracts.asset.balanceOf(bob.address), parseEther("11.339861519219012908"));
        await contracts.asset.connect(bob).approve(contracts.vault.address, ethers.constants.MaxUint256);

        // 1. Alice mints 10 shares (costs 10 tokens)
        await contracts.vault.connect(alice)["mint(uint256,address)"](parseEther("10"), alice.address);
        let expectedShareAmount = await contracts.vault.previewDeposit(parseEther("10"));
        await expectValue(expectedShareAmount, parseEther("10"));
        await expectValue(await contracts.vault.balanceOf(alice.address), parseEther("10"));
        await expectValue(await contracts.vault.assetsOf(alice.address), parseEther("10"));

        // Sanity check.
        await expectValue(await contracts.vault.totalSupply(), parseEther("10"));
        await expectValue(await contracts.vault.totalAssets(), parseEther("10"));

        // 2. Bob deposits 7 tokens (mints 7 shares)
        expectedShareAmount = await contracts.vault.previewDeposit(parseEther("7"));
        await contracts.vault.connect(bob)["deposit(uint256)"](parseEther("7"));
        await expectValue(expectedShareAmount, parseEther("7"));
        await expectValue(await contracts.vault.balanceOf(bob.address), parseEther("7"));
        await expectValue(await contracts.vault.assetsOf(bob.address), parseEther("7"));
        let expectedUnderlyingAmount = await contracts.vault.previewWithdraw(parseEther("7"));
        await expectBigNumberCloseTo(expectedUnderlyingAmount, parseEther("7.035175879396984270"));

        // Sanity check.
        let aliceShareBalance = await contracts.vault.balanceOf(alice.address);
        let bobShareBalance = await contracts.vault.balanceOf(bob.address);
        let vaultShareBalance = await contracts.vault.balanceOf(contracts.vault.address);
        await expectValue(vaultShareBalance, 0);
        await expectValue(aliceShareBalance.add(bobShareBalance), parseEther("17"));

        let aliceUnderlyingBalance = await contracts.vault.assetsOf(alice.address);
        let bobUnderlyingBalance = await contracts.vault.assetsOf(bob.address);
        let vaultUnderlyingBalance = await contracts.vault.assetsOf(contracts.vault.address);
        await expectValue(vaultUnderlyingBalance, 0);
        await expectValue(aliceUnderlyingBalance.add(bobUnderlyingBalance), parseEther("17"));

        await expectValue(await contracts.vault.totalSupply(), parseEther("17"));
        await expectValue(await contracts.vault.totalAssets(), parseEther("17"));

        // 3. Underlying vault balance mutates. (Simulated yield)
        // Alice's vault share is 59%%, Bob's is 41%.
        // Alice's share count stays the same, but underlying amount increases.
        // Bob's share count stays the same, but underlying amount increases.
        // Note: The underlying Yearn vault in this scenario holds fewer assets than the
        // vaults in some of our other tests. This means that accrued yield has a larger impact on the share price.

        // Mint tokens to owner and send to Yearn vault to simulate yield
        // Get Yearn vault address
        const [yearnVault] = await contracts.vault.allVaults();
        // Send 5000 ETH in underlying token to owner address
        await contracts.faucet.sendCrvIbBtcLPTokens(5000, owner.address);
        // Sanity check owner underlying balance
        await expectBigNumberCloseTo(
          await contracts.asset.balanceOf(owner.address),
          parseEther("16.634027872945018017")
        );
        let yearnVaultBalanceBefore = await contracts.asset.balanceOf(yearnVault);
        // Send 16 tokens to Yearn vault address
        await contracts.asset.connect(owner).approve(yearnVault, ethers.constants.MaxUint256);
        await contracts.asset.connect(owner).transfer(yearnVault, parseEther("16"));
        let yearnVaultBalanceAfter = await contracts.asset.balanceOf(yearnVault);
        // Sanity check transfer
        await expectValue(yearnVaultBalanceAfter, yearnVaultBalanceBefore.add(parseEther("16")));

        // Force harvest of fees. This simplifies accounting in the tests.
        // If we did not harvest here, fees would accrue on the next deposit/mint/withdraw/redeem interaction.
        await contracts.vault.takeManagementAndPerformanceFees();
        await expectBigNumberCloseTo(
          await contracts.vault.balanceOf(contracts.vault.address),
          parseEther("1.825503355704697986")
        );
        await expectBigNumberCloseTo(
          await contracts.vault.assetsOf(contracts.vault.address),
          parseEther("3.199999999999999998")
        );

        // Share balances are unchanged
        await expectValue(aliceShareBalance, await contracts.vault.balanceOf(alice.address));
        await expectValue(bobShareBalance, await contracts.vault.balanceOf(bob.address));

        // Underlying amounts increase
        await expectBigNumberCloseTo(
          await contracts.vault.assetsOf(alice.address),
          parseEther("17.529411764705882350")
        );
        await expectBigNumberCloseTo(await contracts.vault.assetsOf(bob.address), parseEther("12.270588235294117645"));

        // 4. Alice deposits 15 tokens
        expectedShareAmount = await contracts.vault.previewDeposit(parseEther("15"));
        await contracts.vault.connect(alice)["deposit(uint256)"](parseEther("15"));
        let actualShareAmount = (await contracts.vault.balanceOf(alice.address)).sub(aliceShareBalance);

        // Share value has increased, so a 15 token deposit mints less than 15 shares.
        // Alice's 15 token deposit mints 8.56 shares.
        await expectBigNumberCloseTo(expectedShareAmount, parseEther("8.557046979865771812"));

        // Total supply increases by 8.56 shares minted to Alice plus 1.83 shares minted for fees
        await expectBigNumberCloseTo(await contracts.vault.totalSupply(), parseEther("27.382550335570469799"));

        // Actual shares minted to Alice equal preview amount.
        await expectBigNumberCloseTo(actualShareAmount, parseEther("8.557046979865771813"));
        await expectBigNumberCloseTo(actualShareAmount, expectedShareAmount, parseEther("0.00000000000001"));

        // Alice's balances increase
        await expectBigNumberCloseTo(
          await contracts.vault.balanceOf(alice.address),
          parseEther("18.557046979865771813")
        );
        await expectBigNumberCloseTo(
          await contracts.vault.assetsOf(alice.address),
          parseEther("32.529411764705882349")
        );

        // Bob's balances are unchanged
        await expectValue(await contracts.vault.balanceOf(bob.address), parseEther("7"));
        await expectBigNumberCloseTo(await contracts.vault.assetsOf(bob.address), parseEther("12.270588235294117645"));

        // Vault balances are unchanged
        await expectBigNumberCloseTo(
          await contracts.vault.balanceOf(contracts.vault.address),
          parseEther("1.825503355704697986")
        );
        await expectBigNumberCloseTo(
          await contracts.vault.assetsOf(contracts.vault.address),
          parseEther("3.199999999999999998")
        );

        // 5. Bob mints 2 shares
        expectedUnderlyingAmount = await contracts.vault.previewMint(parseEther("2"));
        let assetBalanceBefore = await contracts.asset.balanceOf(bob.address);
        await contracts.vault.connect(bob)["mint(uint256,address)"](parseEther("2"), bob.address);
        let assetBalanceAfter = await contracts.asset.balanceOf(bob.address);
        let actualUnderlyingAmount = assetBalanceBefore.sub(assetBalanceAfter);

        // Preview amount equals actual amount transferred.
        // Share value has increased, so minting 15 shares now requires > 15 tokens.
        await expectBigNumberCloseTo(expectedUnderlyingAmount, parseEther("3.505882352941176470"));
        await expectValue(expectedUnderlyingAmount, actualUnderlyingAmount);

        // Total supply increases by 2 shares
        await expectBigNumberCloseTo(await contracts.vault.totalSupply(), parseEther("29.382550335570469798"));

        // Alice's balances are unchanged
        await expectBigNumberCloseTo(
          await contracts.vault.balanceOf(alice.address),
          parseEther("18.557046979865771813")
        );
        await expectBigNumberCloseTo(
          await contracts.vault.assetsOf(alice.address),
          parseEther("32.529411764705882349")
        );

        // Bob's balances increase
        await expectBigNumberCloseTo(await contracts.vault.balanceOf(bob.address), parseEther("8.999999999999999999"));
        await expectBigNumberCloseTo(await contracts.vault.assetsOf(bob.address), parseEther("15.776470588235294113"));

        // Vault balances are unchanged
        await expectBigNumberCloseTo(
          await contracts.vault.balanceOf(contracts.vault.address),
          parseEther("1.825503355704697986")
        );
        await expectBigNumberCloseTo(
          await contracts.vault.assetsOf(contracts.vault.address),
          parseEther("3.199999999999999998")
        );

        // 6. Underlying vault balance mutates. (Simulated yield)
        // Mint tokens to owner and send to Yearn vault to simulate yield
        // Send 10000 ETH in underlying token to owner address
        await contracts.faucet.sendCrvIbBtcLPTokens(10000, owner.address);
        // Sanity check owner underlying balance
        await expectBigNumberCloseTo(
          await contracts.asset.balanceOf(owner.address),
          parseEther("20.818301820603535309")
        );
        yearnVaultBalanceBefore = await contracts.asset.balanceOf(yearnVault);
        // Send 20 tokens to Yearn vault address
        await contracts.asset.connect(owner).transfer(yearnVault, parseEther("20"));
        yearnVaultBalanceAfter = await contracts.asset.balanceOf(yearnVault);
        // Sanity check transfer
        await expectValue(yearnVaultBalanceAfter, yearnVaultBalanceBefore.add(parseEther("20")));

        // Force harvest of fees
        await contracts.vault.takeManagementAndPerformanceFees();

        vaultShareBalance = await contracts.vault.balanceOf(contracts.vault.address);
        vaultUnderlyingBalance = await contracts.vault.assetsOf(contracts.vault.address);
        aliceShareBalance = await contracts.vault.balanceOf(alice.address);
        aliceUnderlyingBalance = await contracts.vault.assetsOf(alice.address);
        bobShareBalance = await contracts.vault.balanceOf(bob.address);
        bobUnderlyingBalance = await contracts.vault.assetsOf(bob.address);

        await expectBigNumberCloseTo(vaultShareBalance, parseEther("3.064763905553268346"));
        await expectBigNumberCloseTo(vaultUnderlyingBalance, parseEther("7.156619446512972559"));

        // Total supply increases by amount minted for fees
        await expectBigNumberCloseTo(await contracts.vault.totalSupply(), parseEther("30.621810885419040158"));
        await expectBigNumberCloseTo(await contracts.vault.totalAssets(), parseEther("71.505882352941176446"));

        // Alice's share balance is unchanged, but assets increase
        await expectBigNumberCloseTo(aliceShareBalance, parseEther("18.557046979865771813"));
        await expectBigNumberCloseTo(aliceUnderlyingBalance, parseEther("43.333100812536284388"));

        // Bob's share balance is unchanged, but assets increase
        await expectBigNumberCloseTo(bobShareBalance, parseEther("8.999999999999999999"));
        await expectBigNumberCloseTo(bobUnderlyingBalance, parseEther("21.016162093891919481"));

        // Sanity check sums
        await expectValue(
          await contracts.vault.totalSupply(),
          vaultShareBalance.add(aliceShareBalance).add(bobShareBalance)
        );

        await expectBigNumberCloseTo(
          await contracts.vault.totalAssets(),
          vaultUnderlyingBalance.add(aliceUnderlyingBalance).add(bobUnderlyingBalance),
          parseEther("0.00000000000001")
        );

        // 7. Alice redeems 13 shares
        expectedUnderlyingAmount = await contracts.vault.previewRedeem(parseEther("13"));
        let underlyingBalanceBefore = await contracts.asset.balanceOf(alice.address);
        await contracts.vault
          .connect(alice)
          ["redeem(uint256,address,address)"](parseEther("13"), alice.address, alice.address);
        let underlyingBalanceAfter = await contracts.asset.balanceOf(alice.address);
        actualUnderlyingAmount = underlyingBalanceAfter.sub(underlyingBalanceBefore);

        // Preview matches actual redeem
        await expectBigNumberCloseTo(actualUnderlyingAmount, parseEther("30.204895187165775394"));
        await expectBigNumberCloseTo(expectedUnderlyingAmount, actualUnderlyingAmount, parseEther("0.00000000000001"));

        vaultShareBalance = await contracts.vault.balanceOf(contracts.vault.address);
        vaultUnderlyingBalance = await contracts.vault.assetsOf(contracts.vault.address);
        aliceShareBalance = await contracts.vault.balanceOf(alice.address);
        aliceUnderlyingBalance = await contracts.vault.assetsOf(alice.address);
        bobShareBalance = await contracts.vault.balanceOf(bob.address);
        bobUnderlyingBalance = await contracts.vault.assetsOf(bob.address);

        // Total supply decreases by 13
        await expectBigNumberCloseTo(await contracts.vault.totalSupply(), parseEther("17.686810885419040158"));
        await expectBigNumberCloseTo(await contracts.vault.totalAssets(), parseEther("41.300987165775401074"));

        // Vault balances remain unchanged
        await expectBigNumberCloseTo(vaultShareBalance, parseEther("3.129763905553268346"));
        await expectBigNumberCloseTo(vaultUnderlyingBalance, parseEther("7.308402839413303092"));

        // Alice's share balance and assets decrease
        await expectBigNumberCloseTo(aliceShareBalance, parseEther("5.557046979865771813"));
        await expectBigNumberCloseTo(aliceUnderlyingBalance, parseEther("12.976422232470178476"));

        // Bob's share balance and assets are unchanged
        await expectBigNumberCloseTo(bobShareBalance, parseEther("8.999999999999999999"));
        await expectBigNumberCloseTo(bobUnderlyingBalance, parseEther("21.016162093891919490"));

        // 8. Bob withdraws 10 assets
        expectedShareAmount = await contracts.vault.previewWithdraw(parseEther("10"));
        underlyingBalanceBefore = await contracts.asset.balanceOf(bob.address);
        let shareBalanceBefore = await contracts.vault.balanceOf(bob.address);

        await contracts.vault.connect(bob)["withdraw(uint256)"](parseEther("10"));

        let shareBalanceAfter = await contracts.vault.balanceOf(bob.address);
        underlyingBalanceAfter = await contracts.asset.balanceOf(bob.address);

        actualShareAmount = shareBalanceBefore.sub(shareBalanceAfter);
        actualUnderlyingAmount = underlyingBalanceAfter.sub(underlyingBalanceBefore);

        // Exactly 10 underlying withdrawn
        await expectBigNumberCloseTo(actualUnderlyingAmount, parseEther("10"));

        // Preview matches actual redeem. 4.37 shares withdrawn.
        await expectBigNumberCloseTo(actualShareAmount, parseEther("4.303938126401369156"));
        await expectBigNumberCloseTo(expectedShareAmount, actualShareAmount, parseEther("0.00000000000001"));

        vaultShareBalance = await contracts.vault.balanceOf(contracts.vault.address);
        vaultUnderlyingBalance = await contracts.vault.assetsOf(contracts.vault.address);
        aliceShareBalance = await contracts.vault.balanceOf(alice.address);
        aliceUnderlyingBalance = await contracts.vault.assetsOf(alice.address);
        bobShareBalance = await contracts.vault.balanceOf(bob.address);
        bobUnderlyingBalance = await contracts.vault.assetsOf(bob.address);

        // Total supply decreases by 4.37
        await expectBigNumberCloseTo(await contracts.vault.totalSupply(), parseEther("13.404392449649677847"));
        // Total assets decreases by 10.05: 10 withdrawn plus 0.05 extra tokens to cover withdrawal fee
        await expectBigNumberCloseTo(await contracts.vault.totalAssets(), parseEther("31.300987165775401076"));

        // Vault share balance and assets are unchanged
        await expectBigNumberCloseTo(vaultShareBalance, parseEther("3.151283596185275191"));
        await expectBigNumberCloseTo(vaultUnderlyingBalance, parseEther("7.358654095694710125"));

        // Alice's share balance and assets are unchanged
        await expectBigNumberCloseTo(aliceShareBalance, parseEther("5.557046979865771813"));
        await expectBigNumberCloseTo(aliceUnderlyingBalance, parseEther("12.976422232470178476"));

        // Bob's share balance and assets decrease
        await expectBigNumberCloseTo(bobShareBalance, parseEther("4.696061873598630844"));
        await expectBigNumberCloseTo(bobUnderlyingBalance, parseEther("10.965910837610512461"));

        // 9. Alice withdraws 12.70 assets
        expectedShareAmount = await contracts.vault.previewWithdraw(parseEther("12.70"));
        underlyingBalanceBefore = await contracts.asset.balanceOf(alice.address);
        shareBalanceBefore = await contracts.vault.balanceOf(alice.address);

        await contracts.vault.connect(alice)["withdraw(uint256)"](parseEther("12.70"));

        shareBalanceAfter = await contracts.vault.balanceOf(alice.address);
        underlyingBalanceAfter = await contracts.asset.balanceOf(alice.address);
        actualShareAmount = shareBalanceBefore.sub(shareBalanceAfter);
        actualUnderlyingAmount = underlyingBalanceAfter.sub(underlyingBalanceBefore);

        // Exactly 12.70 underlying withdrawn
        await expectBigNumberCloseTo(actualUnderlyingAmount, parseEther("12.7"));

        // Preview matches actual redeem. 5.56 shares withdrawn.
        await expectBigNumberCloseTo(actualShareAmount, parseEther("5.466001420529738829"));
        await expectBigNumberCloseTo(expectedShareAmount, actualShareAmount, parseEther("0.00000000000001"));
        vaultShareBalance = await contracts.vault.balanceOf(contracts.vault.address);
        vaultUnderlyingBalance = await contracts.vault.assetsOf(contracts.vault.address);
        aliceShareBalance = await contracts.vault.balanceOf(alice.address);
        aliceUnderlyingBalance = await contracts.vault.assetsOf(alice.address);
        bobShareBalance = await contracts.vault.balanceOf(bob.address);
        bobUnderlyingBalance = await contracts.vault.assetsOf(bob.address);

        // Total supply decreases by 5.56
        await expectBigNumberCloseTo(await contracts.vault.totalSupply(), parseEther("7.965721036222587712"));
        // Total assets decreases by 12.76: 12.70 withdrawn plus 0.06 extra tokens to cover withdrawal fee
        await expectBigNumberCloseTo(await contracts.vault.totalAssets(), parseEther("18.600987165775401076"));

        // Vault share balance and assets are unchanged
        await expectBigNumberCloseTo(vaultShareBalance, parseEther("3.178613603287923885"));
        await expectBigNumberCloseTo(vaultUnderlyingBalance, parseEther("7.422473191172097060"));

        // Alice has withdrawn all but dust
        await expectBigNumberCloseTo(aliceShareBalance, parseEther("0.091045559336032983"));
        await expectBigNumberCloseTo(aliceUnderlyingBalance, parseEther("0.212603136992791548"));

        // Bob's share balance and assets are unchanged
        await expectBigNumberCloseTo(bobShareBalance, parseEther("4.696061873598630844"));
        await expectBigNumberCloseTo(bobUnderlyingBalance, parseEther("10.965910837610512461"));

        // 10. Bob redeems remaining balance
        const remainingShareBalance = await contracts.vault.balanceOf(bob.address);
        const remainingUnderlyingBalance = await contracts.vault.assetsOf(bob.address);
        expectedUnderlyingAmount = await contracts.vault.previewRedeem(remainingShareBalance);
        underlyingBalanceBefore = await contracts.asset.balanceOf(bob.address);

        await contracts.vault
          .connect(bob)
          ["redeem(uint256,address,address)"](remainingShareBalance, bob.address, bob.address);

        shareBalanceAfter = await contracts.vault.balanceOf(bob.address);
        underlyingBalanceAfter = await contracts.asset.balanceOf(bob.address);
        actualUnderlyingAmount = underlyingBalanceAfter.sub(underlyingBalanceBefore);

        await expectBigNumberCloseTo(remainingUnderlyingBalance, parseEther("10.965910837610512461"));
        await expectBigNumberCloseTo(expectedUnderlyingAmount, parseEther("10.911081283422459903"));
        await expectBigNumberCloseTo(actualUnderlyingAmount, parseEther("10.911081283422459901"));
        await expectBigNumberCloseTo(expectedUnderlyingAmount, actualUnderlyingAmount, parseEther("0.00000000000001"));
        await expectValue(shareBalanceAfter, 0);

        vaultShareBalance = await contracts.vault.balanceOf(contracts.vault.address);
        vaultUnderlyingBalance = await contracts.vault.assetsOf(contracts.vault.address);
        aliceShareBalance = await contracts.vault.balanceOf(alice.address);
        aliceUnderlyingBalance = await contracts.vault.assetsOf(alice.address);
        bobShareBalance = await contracts.vault.balanceOf(bob.address);
        bobUnderlyingBalance = await contracts.vault.assetsOf(bob.address);

        // Total supply decreases by 4.64. Only fee shares and dust remain.
        await expectBigNumberCloseTo(await contracts.vault.totalSupply(), parseEther("3.293139471991950022"));
        // Total assets decreases by 10.029. Only fee assets and dust remain.
        await expectBigNumberCloseTo(await contracts.vault.totalAssets(), parseEther("7.689905882352941173"));

        // Vault share balance and assets are unchanged
        await expectBigNumberCloseTo(vaultShareBalance, parseEther("3.202093912655917039"));
        await expectBigNumberCloseTo(vaultUnderlyingBalance, parseEther("7.477302745360149621"));

        // Alice has withdrawn all but dust
        await expectBigNumberCloseTo(aliceShareBalance, parseEther("0.091045559336033"));
        await expectBigNumberCloseTo(aliceUnderlyingBalance, parseEther("0.212603136992792"));

        // Bob's share and underlying balance are now zero
        await expectValue(bobShareBalance, 0);
        await expectValue(bobUnderlyingBalance, 0);
      });
    });
  });
});
