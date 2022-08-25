import useGetMultipleToken from "hooks/tokens/useGetMultipleToken";
import useMultipleERC20 from "hooks/tokens/useMultipleERC20";
import { SWRResponse } from "swr";
import { Token } from "../../../utils/src/types/index";

export default function useTokenList(stableAddresses: string[], spender?: string): SWRResponse<Token[], Error> {
  const cmcStables = useMultipleERC20(stableAddresses);
  return useGetMultipleToken(cmcStables, spender);
}
