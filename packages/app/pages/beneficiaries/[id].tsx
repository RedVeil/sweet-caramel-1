import { ContractsContext } from 'context/Web3/contracts';
import { useRouter } from 'next/router';
import React, { useContext, useEffect, useState } from 'react';
import BeneficiaryPage from 'components/Beneficiaries/BeneficiaryPage';
import {
  BeneficiaryApplication,
  IpfsClient,
  BeneficiaryRegistryAdapter,
} from '@popcorn/utils/';
import Loading from 'components/CommonComponents/Loading';

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
    if (contracts) {
      BeneficiaryRegistryAdapter(contracts.beneficiary, IpfsClient)
        .getBeneficiaryApplication(router.query.id as string)
        .then((beneficiaryApplication) =>
          setBeneficiary(beneficiaryApplication),
        );
    }
  }, [contracts, beneficiaryAddress]);
  return beneficiaryAddress !== undefined && beneficiary !== undefined ? (
    <BeneficiaryPage beneficiary={beneficiary} />
  ) : (
    <Loading />
  );
}
