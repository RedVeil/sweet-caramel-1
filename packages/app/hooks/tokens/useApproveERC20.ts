import { ERC20 } from "@popcorn/hardhat/typechain";
import { Address } from "@popcorn/utils/src/types";
import { constants } from "ethers";
import { isAddress } from "ethers/lib/utils";
import useWeb3 from "hooks/useWeb3";
import { useCallback } from "react";

export default function useApproveERC20() {
  const { library, account, chainId, onContractSuccess, onContractError } = useWeb3();
  return useCallback(
    async (
      erc20: ERC20,
      spender: Address,
      successMessage: string,
      successCallback?: () => void,
      finalCallback?: () => void,
    ) => {
      if (!erc20 || !account || !chainId || !library || !isAddress(spender) || !isAddress(erc20.address)) {
        return null;
      }
      erc20
        .approve(spender, constants.MaxUint256)
        .then((res) => onContractSuccess(res, successMessage, successCallback))
        .catch((err) => onContractError(err))
        .finally(() => finalCallback && finalCallback());
    },
    [account, chainId],
  );
}
