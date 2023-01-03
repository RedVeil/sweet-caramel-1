import { DateTime } from "luxon";
import React, { useEffect, useState } from "react";

interface VotingPeriodCardProps {
  stageDeadline: Date;
  startTime: Date;
}

const NUMBER__OF_CHALLENGE_PERIOD_DAYS = 2;

const VotePeriodCard: React.FC<VotingPeriodCardProps> = ({ stageDeadline, startTime }) => {
  const [openVoteEndDate, setOpenVoteEndDate] = useState<string>("");
  const [challengePeriodEndDate, setChallengePeriodEndDate] = useState<string>("");
  const [timeLeftProgress, setTimeLeftProgress] = useState<number>(0);
  const [challengePeriodPassed, setChallengePeriodPassed] = useState<boolean>();
  useEffect(() => {
    let challengePeriodEnd = new Date(stageDeadline);
    challengePeriodEnd.setDate(challengePeriodEnd.getDate() + NUMBER__OF_CHALLENGE_PERIOD_DAYS);
    setOpenVoteEndDate(DateTime.fromJSDate(stageDeadline).toLocaleString());
    setChallengePeriodEndDate(DateTime.fromJSDate(challengePeriodEnd).toLocaleString(DateTime.DATE_SHORT));
    const interval = setInterval(() => {
      if (stageDeadline && timeLeftProgress < 100) {
        const startDateTime = startTime?.getTime();
        const endTime = stageDeadline?.getTime();
        const currentTime = new Date().getTime();
        const minutesLeft = Math.floor(currentTime - startDateTime / (1000 * 60));
        const minutesTotal = Math.floor(endTime - startDateTime / (1000 * 60));
        const progress = (minutesLeft / minutesTotal) * 100;
        setChallengePeriodPassed(currentTime > challengePeriodEnd.getTime());
        if (progress >= 100 || currentTime >= endTime) {
          setTimeLeftProgress(100);
          clearInterval(interval);
        } else setTimeLeftProgress(progress);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [stageDeadline]);

  const ActiveIndicator = (
    <div className="w-8 h-8 rounded-full border-2 border-customPurple bg-white flex justify-center items-center">
      <div className="w-3 h-3 rounded-full bg-customPurple"></div>
    </div>
  );

  const InactiveIndicator = <div className="w-8 h-8 rounded-full border-2 border-customLightGray bg-white"></div>;

  return (
    <div className="bg-gray-50 rounded-lg md:rounded-t-none md:rounded-b-4xl p-10 md:border-t border-customLightGray">
      <div className="flex items-center justify-center mb-5">
        {ActiveIndicator}
        <div className="w-28 xs:w-44 bg-customLightGray h-0.5">
          <hr className="transition ease-in border border-customPurple" style={{ width: `${timeLeftProgress}%` }} />
        </div>
        {challengePeriodPassed ? ActiveIndicator : InactiveIndicator}
      </div>
      <div className="flex justify-between">
        <div className="text-center">
          <p className="text-primaryDark">Open Vote</p>
          <p className="text-primaryDark">Ends</p>
          <p className="font-medium text-gray-900">{openVoteEndDate}</p>
        </div>

        <div className="text-center">
          <p className="text-primaryDark">Challenge Period</p>
          <p className="text-primaryDark">Ends</p>
          <p className="font-medium text-gray-900">{challengePeriodEndDate}</p>
        </div>
      </div>
    </div>
  );
};

export default VotePeriodCard;
