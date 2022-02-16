import { isAddress } from "@ethersproject/address";
import { ERC20 } from "@popcorn/hardhat/typechain";
import { BigNumber } from "ethers";
import useSWR, { SWRResponse } from "swr";

export default function useTokenAllowance(
  token: ERC20 | undefined,
  owner?: string | null,
  spender?: string,
): SWRResponse<BigNumber, Error> {
  return useSWR(
    [`erc20/allowance`, token, owner, spender],
    async (key: string, tokenContract: ERC20, owner: string | null, spender: string) => {
      if (!isAddress(token.address) || !isAddress(spender) || !isAddress(owner)) {
        return BigNumber.from("0");
      }
      return await tokenContract.allowance(owner, spender);
    },
    {
      refreshInterval: 3 * 1000,
      dedupingInterval: 3 * 1000,
    },
  );
}
