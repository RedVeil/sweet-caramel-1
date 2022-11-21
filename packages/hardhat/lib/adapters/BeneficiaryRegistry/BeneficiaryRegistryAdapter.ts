import { getIpfsHashFromBytes32, IIpfsClient } from "@popcorn/utils";
import { BeneficiaryApplication } from "../BeneficiaryGovernance/BeneficiaryGovernanceAdapter";
import { ethers } from "ethers";

export const BeneficiaryRegistryAdapter = (contract: any, IpfsClient: IIpfsClient) => {
  const getBeneficiaryApplication = async (beneficiaryAddress: string): Promise<BeneficiaryApplication> => {
    const ipfsHash = await contract.getBeneficiary(beneficiaryAddress);
    const beneficiaryApplication = await IpfsClient.get(ipfsHash);
    return { ...beneficiaryApplication, beneficiaryAddress: beneficiaryAddress };
  }
  const getAllBeneficiaryApplications = async (): Promise<BeneficiaryApplication[]> => {
    const beneficiaryAddresses = await contract.getBeneficiaryList();
    return Promise.all(
      beneficiaryAddresses
        .filter((address: string) => address !== "0x0000000000000000000000000000000000000000")
        .map(async (address: string) => getBeneficiaryApplication(address))
    );
  };
  return { getBeneficiaryApplication, getAllBeneficiaryApplications }
};
