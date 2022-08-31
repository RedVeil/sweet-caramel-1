import { BigNumber } from "@ethersproject/bignumber";
import { Zapper } from "@popcorn/hardhat/lib/adapters";
import { ERC20, Vault, ZeroXZapper } from "@popcorn/hardhat/typechain";
import { SweetVaultWithMetadata, Token } from "@popcorn/utils/types";
import { ContractTransaction } from "ethers/lib/ethers";
import toast from "react-hot-toast";

export async function deposit(
  amount: BigNumber,
  slippage: number,
  sweetVault: SweetVaultWithMetadata,
  zapper: Zapper,
  selectedToken: Token,
  revalidate: () => void,
  resetInput: () => void,
  onContractSuccess: (res: ContractTransaction, successMessage: string, successCallback?: () => any) => Promise<void>,
  onContractError: (error: any) => Promise<void>,
  signer: any,
  provider: any,
): Promise<void> {
  zapInOrDeposit(amount, slippage, sweetVault, zapper, selectedToken, signer, provider)
    .then((res) =>
      onContractSuccess(res, `Deposited ${sweetVault?.metadata?.underlyingToken?.name}!`, () => {
        resetInput();
        revalidate();
      }),
    )
    .catch((err) => onContractError(err));
}
async function zapInOrDeposit(
  amount: BigNumber,
  slippage: number,
  sweetVault: SweetVaultWithMetadata,
  zapper: Zapper,
  selectedToken: Token,
  signer: any,
  provider: any,
) {
  if (selectedToken?.address === sweetVault?.metadata?.underlyingToken?.address) {
    toast.loading(`Depositing ${selectedToken?.name} into vault...`);
    return sweetVault?.contract?.connect(signer)["deposit(uint256)"](amount);
  } else {
    toast.loading(`Zapping ${selectedToken?.name} into vault...`);
    return zapper.zapIn(
      { address: selectedToken?.address, decimals: selectedToken?.decimals },
      sweetVault?.contract as Vault,
      await zapper.getPoolAddress(sweetVault?.metadata?.underlyingToken?.address, provider),
      amount,
      slippage / 100,
      false
    );
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
  onContractSuccess: (res: ContractTransaction, successMessage: string, successCallback?: () => any) => Promise<void>,
  onContractError: (error: any) => Promise<void>,
  signer: any,
  provider: any,
): Promise<void> {
  toast.loading(`Withdrawing ${sweetVault?.metadata?.underlyingToken?.name} ...`);
  zapOutOrWithdraw(amount, slippage, sweetVault, zapper, selectedToken, signer, provider)
    .then((res) =>
      onContractSuccess(res, `${sweetVault?.metadata?.underlyingToken?.name} withdrawn!`, () => {
        resetInput();
        revalidate();
      }),
    )
    .catch((err) => onContractError(err));
}
async function zapOutOrWithdraw(
  amount: BigNumber,
  slippage: number,
  sweetVault: SweetVaultWithMetadata,
  zapper: Zapper,
  selectedToken: Token,
  signer: any,
  provider: any,
) {
  if (selectedToken?.address === sweetVault?.metadata?.underlyingToken?.address) {
    return sweetVault?.contract?.connect(signer)["redeem(uint256)"](amount);
  } else {
    return zapper.zapOut(
      { address: selectedToken?.address, decimals: selectedToken?.decimals },
      sweetVault?.contract as Vault,
      await zapper.getPoolAddress(sweetVault?.metadata?.underlyingToken?.address, provider),
      amount,
      slippage / 100,
      false
    );
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
    successMessage: string,
    successCallback?: () => void,
    finalCallback?: () => void,
  ) => Promise<any>,
): void {
  toast.loading(`Approving ${selectedToken?.name} ...`);
  approveToken(selectedToken?.contract?.connect(signer), contract?.address, `${selectedToken?.name} approved!`, () =>
    revalidate(),
  );
}
