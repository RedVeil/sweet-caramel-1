// SPDX-License-Identifier: GPL-3.0
// Docgen-SOLC: 0.8.0

pragma solidity ^0.8.0;

import { KeeperConfig } from "../utils/KeeperIncentivized.sol";

interface IVaultsV1Zapper {
  function previewZapOutTokenAmount(
    address vaultAsset,
    address stableSwap,
    uint256 amount,
    int128 i
  ) external view returns (uint256);

  function previewZapOutTokenAmount(
    address vaultAsset,
    address stableSwap,
    uint256 amount,
    uint256 i
  ) external view returns (uint256);

  function previewRedeemFees(address vaultAsset, uint256 amount) external view returns (uint256);

  function zapIn(
    address sellToken,
    address buyToken,
    address pool,
    address vaultAsset,
    uint256 incomingTokenQty,
    uint256 minToTokens,
    address swapTarget,
    bytes calldata swapData,
    bool stake
  ) external payable;

  function zapOut(
    address vaultAsset,
    address pool,
    uint256 shareAmount,
    address sellToken,
    address buyToken,
    uint256 minTokensBought,
    address swapTarget,
    bytes calldata swapCallData,
    bool unstake
  ) external;

  function updateVault(address underlyingToken, address vault) external;

  function removeVault(address underlyingToken) external;

  function updateZaps(
    address underlyingToken,
    address zapIn,
    address zapOut
  ) external;

  function setGlobalFee(uint256 inBps, uint256 outBps) external;

  function setFee(
    address vaultAsset,
    bool useAssetFee,
    uint256 inBps,
    uint256 outBps
  ) external;

  function setKeeperConfig(address _asset, KeeperConfig memory _config) external;

  function withdrawFees(address vaultAsset) external;
}
