import { DateTime } from "luxon";
import React, { useEffect, useState } from "react";

interface VotingPeriodCardProps {
  stageDeadline: Date;
  startTime: Date;
}
const VotePeriodCard: React.FC<VotingPeriodCardProps> = ({ stageDeadline, startTime }) => {
  const [openVoteEndDate, setOpenVoteEndDate] = useState<string>("");
  const [challengePeriodEndDate, setChallengePeriodEndDate] = useState<string>("");
  const [timeLeftProgress, setTimeLeftProgress] = useState<number>(0);
  useEffect(() => {
    let challengePeriodEnd = new Date(stageDeadline);
    challengePeriodEnd.setDate(challengePeriodEnd.getDate() + 2);
    setOpenVoteEndDate(DateTime.fromJSDate(stageDeadline).toLocaleString());
    setChallengePeriodEndDate(DateTime.fromJSDate(challengePeriodEnd).toLocaleString(DateTime.DATE_SHORT));
    const interval = setInterval(() => {
      if (stageDeadline && timeLeftProgress < 100) {
        const startDateTime = startTime.getTime();
        const endTime = stageDeadline.getTime();
        const currentTime = new Date().getTime();
        let distanceWhole = startDateTime - endTime;
        let distanceLeft = startDateTime - currentTime;
        let minutesLeft = Math.floor(distanceLeft / (1000 * 60));
        let minutesTotal = Math.floor(distanceWhole / (1000 * 60));
        let progress = (minutesLeft / minutesTotal) * 100;
        if (progress >= 100 || currentTime >= endTime) {
          setTimeLeftProgress(100);
          clearInterval(interval);
        } else setTimeLeftProgress(progress);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [stageDeadline]);

  const ActiveIndicator = (
    <div className="w-8 h-8 rounded-full border-2 border-blue-600 bg-white flex justify-center items-center">
      <div className="w-3 h-3 rounded-full bg-blue-600"></div>
    </div>
  );

  const InactiveIndicator = <div className="w-8 h-8 rounded-full border-2 border-gray-300 bg-white"></div>;

  return (
    <div className="bg-gray-50 rounded-4xl md:rounded-t-none p-10 ">
      <p className="text-center text-gray-900 text-2xl font-semibold mb-5 md:hidden">Timeline</p>
      <div className="flex items-center justify-center mb-5">
        {ActiveIndicator}
        <div className="w-40">
          <hr className="transition ease-in border border-blue-600" style={{ width: `${timeLeftProgress}%` }} />
        </div>
        {timeLeftProgress < 100 ? InactiveIndicator : ActiveIndicator}
      </div>
      <div className="flex justify-between">
        <div className="text-center">
          <p className="text-gray-500">Open Vote</p>
          <p className="text-gray-500">Ends</p>
          <p className="font-semibold text-gray-900">{openVoteEndDate}</p>
        </div>

        <div className="text-center">
          <p className="text-gray-500">Challenge Period</p>
          <p className="text-gray-500">Ends</p>
          <p className="font-semibold text-gray-900">{challengePeriodEndDate}</p>
        </div>
      </div>
    </div>
  );
};

export default VotePeriodCard;
