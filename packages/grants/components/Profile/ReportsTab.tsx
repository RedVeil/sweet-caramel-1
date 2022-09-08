import { PaperClipIcon } from "@heroicons/react/solid";
import { ImpactReport } from "@popcorn/hardhat/lib/adapters/BeneficiaryGovernance/BeneficiaryGovernanceAdapter";
import NotFoundError from "components/CommonComponents/NotFoundError";
import React from "react";

const ReportsTab = ({ reports }: { reports: ImpactReport[] }) => {
  return (
    <>
      {reports.length > 0 ? (
        <div className="border border-gray-200 rounded-2xl my-4 lg:mx-5">
          {reports.map((report) => (
            <div
              className=" flex justify-between py-3 px-4 items-center font-semibold border-b border-gray-200 last:border-none"
              key={report.hash}
            >
              <div className="flex gap-2">
                <PaperClipIcon className="h-5 w-5 text-gray-400" />
                <p className="text-gray-900 w-1/2 md:w-4/6 lg:w-5/6 text-ellipsis whitespace-nowrap overflow-hidden">
                  {report.fileName}
                </p>
              </div>
              <a
                className="text-blue-600 hover:text-blue-900 text-sm font-semibold ml-2"
                href={`${process.env.IPFS_URL}${report.hash}`}
                download
                target="_blank"
              >
                Download
              </a>
            </div>
          ))}
        </div>
      ) : (
        <NotFoundError title="No Report Available" image="/images/emptyreports.svg">
          <p className="text-gray-700">This organization has not submitted any report.</p>
        </NotFoundError>
      )}
    </>
  );
};

export default ReportsTab;
