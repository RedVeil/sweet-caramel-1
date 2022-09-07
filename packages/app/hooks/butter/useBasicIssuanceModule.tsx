import { isAddress } from "@ethersproject/address";
import { IBasicIssuanceModule, IBasicIssuanceModule__factory } from "@popcorn/hardhat/typechain";
import useWeb3 from "hooks/useWeb3";
import { useMemo } from "react";

export default function useBasicIssuanceModule(): IBasicIssuanceModule {
  const { signerOrProvider, contractAddresses, account } = useWeb3();

  return useMemo(() => {
    if (isAddress(contractAddresses?.butterDependency?.setBasicIssuanceModule))
      return IBasicIssuanceModule__factory.connect(
        contractAddresses?.butterDependency?.setBasicIssuanceModule,
        signerOrProvider,
      );
  }, [account, signerOrProvider, contractAddresses?.butterDependency?.setBasicIssuanceModule]);
}
