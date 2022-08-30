import { isAddress } from "@ethersproject/address";
import { BasicIssuanceModule, BasicIssuanceModule__factory } from "@popcorn/hardhat/typechain";
import useWeb3 from "hooks/useWeb3";
import { useMemo } from "react";

export default function useBasicIssuanceModule(rpcProvider?): BasicIssuanceModule {
  const { signerOrProvider, contractAddresses, account } = useWeb3();

  return useMemo(() => {
    if (isAddress(contractAddresses?.butterDependency?.setBasicIssuanceModule))
      return BasicIssuanceModule__factory.connect(
        contractAddresses?.butterDependency?.setBasicIssuanceModule,
        rpcProvider ? rpcProvider : signerOrProvider,
      );
  }, [account, signerOrProvider, contractAddresses?.butterDependency?.setBasicIssuanceModule]);
}
