// SPDX-License-Identifier: GPL-3.0
// Docgen-SOLC: 0.8.0

pragma solidity ^0.8.0;

interface IZapOut {
  /**
   * @notice Common interfacte for CurveZapper (returning LP Tokens) or SwapZapper (just swapping)
   * @param poolAddress Address of curve Pool for curve zapper, unused by SwapZapper
   * @param incomingTokenQty Amount of incoming sellToken for SwapZapper or amount LP-Token for CurveZapper
   * @param sellToken Address of the token transfered to the Zapper to be sold
   * @param buyToken Address of the token to be bought by the Zapper (Pool Underlying for CurveZapper)
   * @param minTokensBought Minimum amount of buyTokens to be bought
   * @param swapTarget must be ZEROX_ROUTER
   * @param swapCallData Calldata for ZEROX_ROUTER to perform the swap (from 0x Api)
   * @param affiliate The address of the contract calling the Zapper
   * @param shouldSellEntireBalance always false
   */
  function ZapOut(
    address poolAddress,
    uint256 incomingTokenQty,
    address sellToken,
    address buyToken,
    uint256 minTokensBought,
    address swapTarget,
    bytes calldata swapCallData,
    address affiliate,
    bool shouldSellEntireBalance
  ) external payable returns (uint256);
}
