import { ERC20 } from "@popcorn/hardhat/typechain";
import { getMultipleToken } from "@popcorn/utils";
import { Token } from "@popcorn/utils/src/types";
import { useEffect, useState } from "react";

export default function useGetMultipleToken(tokenContracts: ERC20[] | null): Token[] | undefined {
  const [token, setToken] = useState<Token[]>();
  useEffect(() => {
    if (!tokenContracts) {
      return;
    }
    let mounted = true;
    getMultipleToken(tokenContracts).then((res) => mounted && setToken(res));
    return () => {
      mounted = false;
    };
  }, [tokenContracts]);
  return token;
}
