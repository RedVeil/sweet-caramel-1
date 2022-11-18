import { isAddress } from "@ethersproject/address";
import { ERC20 } from "@popcorn/hardhat/typechain";
import { BigNumber, constants } from "ethers";
import useSWR, { SWRResponse } from "swr";

export default function useTokenBalance(
  token: ERC20 | undefined,
  account: string | undefined | null,
): SWRResponse<BigNumber, Error> {
  return useSWR(
    [`erc20/${token?.address}/balanceOf/${account}`, account],
    async (key: string, account: string | undefined | null) => {
      if (!isAddress(token?.address) || !isAddress(account) || !token) {
        return constants.Zero;
      }
      return token?.balanceOf(account) || constants.Zero;
    },
    {
      refreshInterval: 3 * 1000,
      dedupingInterval: 5 * 1000,
    },
  );
}
