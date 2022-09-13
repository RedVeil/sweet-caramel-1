import { ChainId } from "@popcorn/utils";
import TransactionToast, { ToastParams } from "components/Notifications/TransactionToast";
import { ethers } from "ethers";
import { useCallback } from "react";
import toast from "react-hot-toast";

function confirmationsPerChain(chainId: ChainId): number {
  switch (chainId) {
    case ChainId.Polygon:
      return 2;
    case ChainId.Hardhat:
    case ChainId.Localhost:
      return 0;
    default:
      return 1;
  }
}

export default function useWeb3Callbacks(chainId: number) {
  return {
    onSuccess: useCallback(
      async (res: ethers.ContractTransaction, successMessage: ToastParams, successCallback?: () => any): Promise<void> => {
        res.wait(confirmationsPerChain(chainId)).then(async (res) => {
          TransactionToast.success(successMessage)
          successCallback && (await successCallback());
        });
      },
      [chainId],
    ),
    onError: useCallback(
      async (error, errorMessage: string) => {
        if (
          error.message === "MetaMask Tx Signature: User denied transaction signature." ||
          "Error: User denied transaction signature"
        ) {
          TransactionToast.error({ title: "Transaction Canceled", description: errorMessage })
        } else {
          TransactionToast.error({ title: "Transaction Failed", description: error.message.split("'")[1] })
        }
      },
      [chainId],
    ),
  };
}
