// SPDX-License-Identifier: GPL-3.0
// Docgen-SOLC: 0.8.0

pragma solidity ^0.8.0;

interface IZapIn {
  /**
   * @notice Common interfacte for CurveZapper (returning LP Tokens) or SwapZapper (just swapping)
   * @param sellToken Address of the token transfered to the Zapper to be sold
   * @param buyToken Address of the token to be bought by the Zapper (Pool Underlying for CurveZapper)
   * @param poolAddress Address of curve Pool for curve zapper, unused by SwapZapper
   * @param incomingTokenQty Amount of incoming sellToken
   * @param minToTokens Minimum amount of buyTokens to be bought by SwapZapper or of LP-Tokens to be got by CurveZapper
   * @param swapTarget must be ZEROX_ROUTER
   * @param swapData Calldata for ZEROX_ROUTER to perform the swap (from 0x Api)
   * @param affiliate The address of the contract calling the Zapper
   */
  function ZapIn(
    address sellToken,
    address buyToken,
    address poolAddress,
    uint256 incomingTokenQty,
    uint256 minToTokens,
    address swapTarget,
    bytes calldata swapData,
    address affiliate
  ) external payable returns (uint256);
}
