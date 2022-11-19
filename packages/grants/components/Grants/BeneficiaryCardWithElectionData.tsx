import { BeneficiaryApplication, GrantElectionAdapter } from "@popcorn/hardhat/lib/adapters";
import Link from "next/link";
import { ElectionProps } from "./ElectionProps";
import GrantFunded from "./GrantFunded";
import VoteSlider from "./VoteSlider";
interface BeneficiaryCardWithElectionDataProps {
  beneficiary: BeneficiaryApplication;
  electionProps: ElectionProps;
}

const BeneficiaryCardWithElectionData: React.FC<BeneficiaryCardWithElectionDataProps> = ({
  electionProps,
  beneficiary,
}) => {
  return (
    <div className="shadow-sm w-80 h-auto rounded-lg mr-8 mb-16 bg-white border-b border-gray-200 ">
      <Link href={`/beneficiaries/${beneficiary?.beneficiaryAddress}`} passHref>
        <div className="w-full h-32 rounded-t-lg">
          <img
            className="w-100 h-auto md:w-100 md:h-auto md:rounded-t rounded-t mx-auto"
            src={`${process.env.IPFS_URL}${beneficiary?.files?.profileImage?.image}`}
            alt=""
            style={{ objectFit: "cover", height: "140px" }}
          ></img>
        </div>
      </Link>
      <div className="w-full px-4 pb-6 pt-6">
        <div className="h-10 mt-3">
          <Link href={`/beneficiaries/${beneficiary?.beneficiaryAddress}`} passHref>
            <h3 className="text-lg font-bold text-gray-800 leading-snug">{beneficiary?.organizationName}</h3>
          </Link>
        </div>
        <div className="h-32 overflow-hidden overflow-clip">
          <Link href={`/beneficiaries/${beneficiary?.beneficiaryAddress}`} passHref>
            <p className="text-sm text-gray-700">{beneficiary?.missionStatement}</p>
          </Link>
        </div>
        <div className="">
          {GrantElectionAdapter().isActive(electionProps.election) ? (
            <VoteSlider electionProps={electionProps} beneficiary={beneficiary} />
          ) : (
            <GrantFunded electionProps={electionProps} beneficiary={beneficiary} />
          )}
        </div>
      </div>
    </div>
  );
};

export default BeneficiaryCardWithElectionData;
