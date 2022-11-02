import { ERC20__factory } from "@popcorn/hardhat/typechain";
import { getToken } from "@popcorn/utils";
import { useEffect, useState } from "react";
import { Token } from "@popcorn/utils/src/types/index";

export default function useERC20Sample(address: string | null, staticRpcProvider?): Token {
  const [token, setToken] = useState<Token>(null);
  useEffect(() => {
    let mounted = true;
    if (address) {
      getToken(
        ERC20__factory.connect(address, staticRpcProvider),
        staticRpcProvider,
        1,
      )
        .then((token) => mounted && setToken(token))
        .catch((err) => { });
    }
    return () => {
      mounted = false;
    };
  }, [address]);

  return token;
}
