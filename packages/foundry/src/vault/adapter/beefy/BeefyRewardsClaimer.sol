// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.15;

import { BeefyERC4626, ERC20, SafeERC20, Math, IBeefyVault, IBeefyBooster, IContractRegistry } from "./BeefyERC4626.sol";
import { RewardsClaimer } from "../../utils/RewardsClaimer.sol";

/**
 * @title Beefy ERC4626 Contract
 * @notice ERC4626 wrapper for beefy vaults
 * @author RedVeil
 *
 * Wraps https://github.com/beefyfinance/beefy-contracts/blob/master/contracts/BIFI/vaults/BeefyVaultV6.sol
 */
contract BeefyRewardsClaimer is BeefyERC4626, RewardsClaimer {
  using SafeERC20 for ERC20;
  using Math for uint256;

  /*//////////////////////////////////////////////////////////////
                               IMMUTABLES
    //////////////////////////////////////////////////////////////*/

  /**
     @notice Initializes the Vault.
     @param asset The ERC20 compliant token the Vault should accept.
     @param _beefyVault The Beefy Vault contract.
     @param _withdrawalFee of the beefyVault in BPS
    */
  function initialize(
    ERC20 asset,
    IBeefyVault _beefyVault,
    IBeefyBooster _beefyBooster,
    uint256 _withdrawalFee,
    IContractRegistry contractRegistry_,
    address _rewardDestination,
    ERC20[] memory _rewardTokens
  ) public {
    super.initialize(asset, _beefyVault, _beefyBooster, _withdrawalFee, contractRegistry_);
    __RewardsClaimer_init(_rewardDestination, _rewardTokens);
  }

  /*//////////////////////////////////////////////////////////////
                            ACCOUNTING LOGIC
    //////////////////////////////////////////////////////////////*/

  function rewardToken() external view returns (address) {
    return beefyBooster.rewardToken();
  }

  function earned() public view returns (uint256) {
    return beefyBooster.earned(address(this));
  }

  /*//////////////////////////////////////////////////////////////
                            HARVESTING LOGIC
    //////////////////////////////////////////////////////////////*/

  function beforeHarvest() internal override {
    claimRewards();
  }

  /*//////////////////////////////////////////////////////////////
                          INTERNAL HOOKS LOGIC
    //////////////////////////////////////////////////////////////*/

  function beforeClaim() internal override {
    beefyBooster.getReward();
  }
}
