import { isAddress } from "@ethersproject/address";
import { ERC20 } from "@popcorn/hardhat/typechain";
import { BigNumber } from "ethers";
import useSWR, { SWRResponse } from "swr";

export default function useTokenBalance(
  token: ERC20 | undefined,
  account: string | undefined | null,
): SWRResponse<BigNumber, Error> {
  return useSWR(
    [`erc20/${token?.address}/balanceOf/${account}`, account],
    async (key: string, account: string | undefined | null) => {
      if (!isAddress(token?.address) || !isAddress(account) || !token) {
        return BigNumber.from("0");
      }
      return token?.balanceOf(account) || BigNumber.from("0");
    },
    {
      refreshInterval: 3 * 1000,
      dedupingInterval: 5 * 1000,
    },
  );
}
