import { ERC20Permit } from "@popcorn/hardhat/typechain";
import getSignature, { permitTypes } from "@popcorn/utils/src/getSignature";
import { Address } from "@popcorn/utils/src/types";
import { BigNumber, constants } from "ethers";
import { isAddress } from "ethers/lib/utils";
import useWeb3 from "hooks/useWeb3";
import { useCallback } from "react";

export default function useApproveERC20() {
  const { signerOrProvider, rpcProvider, account, chainId, onContractSuccess, onContractError } = useWeb3();
  return useCallback(
    async (
      erc20: ERC20Permit,
      spender: Address,
      value: BigNumber,
      toast: any,
      successMessage: string,
      successCallback?: () => void,
      finalCallback?: () => void,
    ) => {
      if (!erc20 || !account || !chainId || !signerOrProvider || !isAddress(spender) || !isAddress(erc20.address)) {
        return null;
      }
      try {
        await erc20.DOMAIN_SEPARATOR();
      } catch {
        return await erc20
          .approve(spender, constants.MaxUint256)
          .then((res) => onContractSuccess(res, successMessage, successCallback))
          .catch((err) => onContractError(err))
          .finally(() => finalCallback && finalCallback());
      }

      await getSignature(
        rpcProvider,
        signerOrProvider,
        permitTypes.AMOUNT, //: permitTypes.ALLOWED,
        account,
        spender,
        erc20,
        chainId,
        value,
      )
        .then(async (res) => {
          toast.dismiss();
          toast.success("Token approved!");
          const name = await erc20.name();
          const stringifiedSig = JSON.stringify({
            v: res.v,
            r: res.r,
            s: res.s,
            deadline: res.deadline,
            value: res.value,
            nonce: res.nonce,
          });
          localStorage.setItem(name + "Signature", stringifiedSig);
        })
        .catch((err) => onContractError(err));
    },
    [account, chainId],
  );
}
