import { BeneficiaryApplication } from "@popcorn/hardhat/lib/adapters";
import CardBody from "components/CommonComponents/CardBody";
import Link from "next/link";

interface BeneficiaryCardProps {
  beneficiary: BeneficiaryApplication;
}

const BeneficiaryCard: React.FC<BeneficiaryCardProps> = ({ beneficiary }) => {
  return (
    <div
      key={beneficiary?.beneficiaryAddress.data}
      className="flex flex-col rounded-lg shadow-lg overflow-hidden bg-white"
    >
      <Link href={`/beneficiaries/${beneficiary?.beneficiaryAddress.data}`} passHref>
        <a>
          <CardBody
            image={beneficiary?.files.profileImage}
            name={beneficiary?.organizationName.data}
            missionStatement={beneficiary?.missionStatement.data}
          />
        </a>
      </Link>
    </div>
  );
};
export default BeneficiaryCard;
