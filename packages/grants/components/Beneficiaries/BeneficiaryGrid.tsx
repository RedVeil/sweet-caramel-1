import Button from "components/CommonComponents/Button";
import CardBody from "components/CommonComponents/CardBody";
import { CardLoader } from "components/CommonComponents/CardLoader";
import NotFoundError from "components/CommonComponents/NotFoundError";
import Link from "next/link";
import React, { useState } from "react";

const INITIAL_OFFSET = 9;

interface IBeneficiaryGridProps {
  isLoading: boolean;
  data: any[];
  isApplication?: boolean;
}

export const BeneficiaryGrid: React.FC<IBeneficiaryGridProps> = (props) => {
  const { isLoading, data, isApplication } = props;
  const [offset, setOffset] = useState<number>(INITIAL_OFFSET);

  const seeMore = () => {
    const newOffset = offset + INITIAL_OFFSET;
    setOffset(newOffset);
  };

  return (
    <>
      <div className="grid grid-cols-12 gap-x-0 gap-y-10 md:gap-x-10">
        {isLoading &&
          [1, 2, 3].map((i) => (
            <div className="col-span-12 md:col-span-6 lg:col-span-4" key={i}>
              <CardLoader key={i} />
            </div>
          ))}
        {!isLoading && data.length <= 0 ? (
          <div className="col-span-12">
            <NotFoundError
              image="/images/emptyBeneficiariesState.svg"
              title="There are no Beneficiary Applications currently"
            >
              <p className="text-gray-700">
                Check back at a later date or follow our{" "}
                <a href="https://discord.gg/w9zeRTSZsq" target="_blank" className="text-blue-600 font-semibold">
                  Discord
                </a>{" "}
                or{" "}
                <a href="https://twitter.com/Popcorn_DAO" target="_blank" className="text-blue-600 font-semibold">
                  Twitter
                </a>{" "}
                for more information.
              </p>
            </NotFoundError>
          </div>
        ) : (
          data?.slice(0, offset)?.map((beneficiary, index) => (
            <div className="col-span-12 md:col-span-6 lg:col-span-4" key={index}>
              {isApplication ? (
                <Link passHref href={`/applications/${beneficiary.id}`}>
                  <a>
                    <CardBody
                      image={beneficiary?.application?.files?.headerImage}
                      {...beneficiary?.application}
                      stageDeadline={beneficiary.stageDeadline}
                      votes={beneficiary.votes}
                      status={beneficiary.status}
                      isApplication={isApplication}
                    />
                  </a>
                </Link>
              ) : (
                <Link passHref href={`/beneficiaries/${beneficiary.beneficiaryAddress}`}>
                  <a>
                    <CardBody image={beneficiary?.files?.headerImage} {...beneficiary} />
                  </a>
                </Link>
              )}
            </div>
          ))
        )}
      </div>
      {data?.length > 0 && (
        <div className="flex justify-center mt-12 lg:mt-20">
          <Button variant="secondary" onClick={seeMore} disabled={data.length <= offset}>
            See more
          </Button>
        </div>
      )}
    </>
  );
};
