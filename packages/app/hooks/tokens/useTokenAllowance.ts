import { isAddress } from "@ethersproject/address";
import { ERC20Permit } from "@popcorn/hardhat/typechain";
import { BigNumber, constants } from "ethers";
import useSWR, { SWRResponse } from "swr";

async function checkPermit(erc20: ERC20Permit) {
  try {
    await erc20.DOMAIN_SEPARATOR();
    return true;
  } catch (e) {
    return false;
  }
}

export async function getTokenAllowance(
  tokenContract: ERC20Permit,
  owner?: string | null,
  spender?: string,
  provider?: any,
): Promise<BigNumber> {
  if (!isAddress(tokenContract.address) || !isAddress(spender) || !isAddress(owner)) {
    return constants.Zero;
  }
  const isPermit = await checkPermit(tokenContract);

  if (!isPermit) {
    return await tokenContract.allowance(owner, spender);
  }

  const signature = localStorage.getItem((await tokenContract.name()) + "Signature");
  if (signature) {
    const parsedSignature = JSON.parse(signature);
    const currentTimestamp = (await provider.getBlock("latest")).timestamp;
    if (parsedSignature?.deadline > currentTimestamp) {
      return parsedSignature.value;
    }
  }
  return constants.Zero;
}

export default function useTokenAllowance(
  token: ERC20Permit,
  owner?: string | null,
  spender?: string,
  provider?: any,
): SWRResponse<BigNumber> {
  return useSWR(
    [`erc20/allowance`, token, owner, spender, provider],
    async (key: string, tokenContract: ERC20Permit, owner: string | null, spender: string, provider: any) => {
      return await getTokenAllowance(tokenContract, owner, spender, provider);
    },
    {
      refreshInterval: 3 * 1000,
      dedupingInterval: 3 * 1000,
    },
  );
}
