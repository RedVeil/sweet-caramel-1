import { ERC20Permit__factory } from "@popcorn/hardhat/typechain";
import { getToken } from "@popcorn/utils";
import { useEffect, useState } from "react";
import { Token } from "../../../utils/src/types/index";
import useWeb3 from "../useWeb3";

export default function useERC20Permit(address: string | null, permit: boolean = false): Token {
  const { library, account } = useWeb3();
  const [token, setToken] = useState<Token>(null);
  useEffect(() => {
    let mounted = true;
    if (address && library) {
      getToken(ERC20Permit__factory.connect(address, account ? library.getSigner() : library))
        .then((token) => mounted && setToken(token))
        .catch((err) => {});
    }
    return () => {
      mounted = false;
    };
  }, [address, library, account]);

  return token;
}
