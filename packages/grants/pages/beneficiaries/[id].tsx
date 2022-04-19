import { BeneficiaryApplication, BeneficiaryRegistryAdapter } from "@popcorn/hardhat/lib/adapters";
import { IpfsClient } from "@popcorn/utils";
import BeneficiaryPage from "components/Beneficiaries/BeneficiaryPage";
import Loading from "components/CommonComponents/Loading";
import { ContractsContext } from "context/Web3/contracts";
import { useRouter } from "next/router";
import React, { useContext, useEffect, useState } from "react";

export default function SingleBeneficiaryPage(): JSX.Element {
  const router = useRouter();
  const { contracts } = useContext(ContractsContext);
  const [beneficiary, setBeneficiary] = useState<BeneficiaryApplication>();
  const [beneficiaryAddress, setBeneficiaryAddress] = useState<string>();

  useEffect(() => {
    const { id } = router.query;
    if (id && id !== beneficiaryAddress) setBeneficiaryAddress(id as string);
  }, [router, beneficiaryAddress]);
  useEffect(() => {
    if (contracts?.beneficiaryRegistry && beneficiaryAddress) {
      BeneficiaryRegistryAdapter(contracts.beneficiaryRegistry, IpfsClient)
        .getBeneficiaryApplication(beneficiaryAddress)
        .then((beneficiaryApplication) => setBeneficiary(beneficiaryApplication));
    }
  }, [contracts, beneficiaryAddress]);
  return (beneficiary && <BeneficiaryPage beneficiary={beneficiary} />) || <Loading />;
}
