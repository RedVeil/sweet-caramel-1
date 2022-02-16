import { ERC20__factory } from "@popcorn/hardhat/typechain";
import { getToken } from "@popcorn/utils";
import { useMemo } from "react";
import useSWR, { SWRResponse } from "swr";
import { Token } from "../../../utils/src/types/index";
import useWeb3 from "../useWeb3";

export default function useERC20(address: string | null): SWRResponse<Token, Error> {
  const { library, chainId, account } = useWeb3();

  const token = useMemo(
    () => (address && library ? ERC20__factory.connect(address, account ? library.getSigner() : library) : null),
    [library, address, account, chainId],
  );
  const shouldFetch = !!address && !!chainId;
  return useSWR(shouldFetch && [token, address, account, chainId], (token) => {
    return getToken(token);
  });
}
