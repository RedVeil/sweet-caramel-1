import { ERC20__factory } from "@popcorn/hardhat/typechain";
import { getToken } from "@popcorn/utils";
import { useEffect, useState } from "react";
import { Token } from "../../../utils/src/types/index";
import useWeb3 from "../useWeb3";

export default function useERC20(address: string | null): Token {
  const { signerOrProvider, rpcProvider, account, chainId } = useWeb3();
  const [token, setToken] = useState<Token>(null);
  useEffect(() => {
    let mounted = true;
    if (address && signerOrProvider) {
      getToken(ERC20__factory.connect(address, signerOrProvider), rpcProvider, chainId)
        .then((token) => mounted && setToken(token))
        .catch((err) => { });
    }
    return () => {
      mounted = false;
    };
  }, [address, signerOrProvider, account]);

  return token;
}
