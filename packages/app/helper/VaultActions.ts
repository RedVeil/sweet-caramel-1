import { BigNumber } from "@ethersproject/bignumber";
import { Zapper } from "@popcorn/hardhat/lib/adapters";
import { ERC20, Vault, ZeroXZapper } from "@popcorn/hardhat/typechain";
import { formatAndRoundBigNumber } from "@popcorn/utils";
import { SweetVaultWithMetadata, Token } from "@popcorn/utils/types";
import TransactionToast, { ToastParams } from "components/Notifications/TransactionToast";
import { ContractTransaction } from "ethers/lib/ethers";

export async function deposit(
  amount: BigNumber,
  slippage: number,
  sweetVault: SweetVaultWithMetadata,
  zapper: Zapper,
  selectedToken: Token,
  revalidate: () => void,
  resetInput: () => void,
  onContractSuccess: (res: ContractTransaction, successMessage: ToastParams, successCallback?: () => any) => Promise<void>,
  onContractError: (error: any, errorMessage: string) => Promise<void>,
  signer: any,
  provider: any,
): Promise<void> {
  const toastDescription = `${formatAndRoundBigNumber(amount, selectedToken.decimals)} ${selectedToken.symbol}`

  if (selectedToken?.address === sweetVault?.metadata?.underlyingToken?.address) {
    TransactionToast.loading({ title: "Depositing", description: toastDescription })

    return sweetVault?.contract?.connect(signer)["deposit(uint256)"](amount).then(
      (res) =>
        onContractSuccess(res, { title: "Deposited successfully", description: toastDescription }, () => {
          resetInput();
          revalidate();
        }),
      (err) => onContractError(err, `Depositing ${toastDescription}`));

  } else {
    TransactionToast.loading({ title: "ZapDepositing", description: toastDescription })

    return zapper.zapIn(
      { address: selectedToken?.address, decimals: selectedToken?.decimals },
      sweetVault?.contract as Vault,
      await zapper.getPoolAddress(sweetVault?.metadata?.underlyingToken?.address, provider),
      amount,
      slippage / 100,
      false
    ).then(
      (res) =>
        onContractSuccess(res, { title: "ZapDeposited successfully", description: toastDescription }, () => {
          resetInput();
          revalidate();
        }),
      (err) => onContractError(err, `ZapDepositing ${toastDescription}`));
  }
}

export async function withdraw(
  amount: BigNumber,
  slippage: number,
  sweetVault: SweetVaultWithMetadata,
  zapper: Zapper,
  selectedToken: Token,
  revalidate: () => void,
  resetInput: () => void,
  onContractSuccess: (res: ContractTransaction, successMessage: ToastParams, successCallback?: () => any) => Promise<void>,
  onContractError: (error: any, errorMessage: string) => Promise<void>,
  signer: any,
  provider: any,
): Promise<void> {
  const toastDescription = `${formatAndRoundBigNumber(amount, selectedToken.decimals)} ${selectedToken.symbol}`

  if (selectedToken?.address === sweetVault?.metadata?.underlyingToken?.address) {
    TransactionToast.loading({ title: "Withdrawing", description: toastDescription })

    return sweetVault?.contract?.connect(signer)["redeem(uint256)"](amount).then(
      (res) =>
        onContractSuccess(res, { title: "Withdrawn successfully", description: toastDescription }, () => {
          resetInput();
          revalidate();
        }),
      (err) => onContractError(err, `Withdrawing ${toastDescription}`));

  } else {
    TransactionToast.loading({ title: "ZapWithdrawing", description: toastDescription })

    return zapper.zapOut(
      { address: selectedToken?.address, decimals: selectedToken?.decimals },
      sweetVault?.contract as Vault,
      await zapper.getPoolAddress(sweetVault?.metadata?.underlyingToken?.address, provider),
      amount,
      slippage / 100,
      false
    ).then(
      (res) =>
        onContractSuccess(res, { title: "ZapWithdrawn successfully", description: toastDescription }, () => {
          resetInput();
          revalidate();
        }),
      (err) => onContractError(err, `ZapWithdrawing ${toastDescription}`));
  }
}

export function approve(
  contract: Vault | ZeroXZapper,
  selectedToken: Token,
  revalidate: () => void,
  signer: any,
  approveToken: (
    erc20: ERC20,
    spender: string,
    successMessage: ToastParams,
    errorMessage: string,
    successCallback?: () => void,
    finalCallback?: () => void,
  ) => Promise<any>,
): void {
  const toastDescription = `${selectedToken?.symbol} for Sweet Vault`
  TransactionToast.loading({ title: "Approving", description: toastDescription })

  approveToken(selectedToken?.contract?.connect(signer),
    contract?.address,
    { title: "Approved successfully", description: toastDescription },
    `Approving ${toastDescription}`,
    () => revalidate(),
  );
}
