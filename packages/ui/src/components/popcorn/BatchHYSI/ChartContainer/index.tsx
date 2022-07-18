import { useState } from 'react';
import { ChartData, HYSIAreaChart } from '../AreaChart';
import { TimeRangeButtonGroup } from '../TimeRangeButtonGroup';

interface ChartContainerProps {
  chartData: ChartData[];
}

export const ChartContainer: React.FC<ChartContainerProps> = ({
  chartData,
}): JSX.Element => {
  const [range, setRange] = useState<string>('30D');
  return (
    <div className="justify-items-center bg-white shadow rounded-lg py-4">
      <p className="text-3xl font-bold text-center">Annual Percentage Yield</p>
      <p className="text-md text-gray-600 text-center mb-10">Historic vAPR</p>
      <TimeRangeButtonGroup range={range} setRange={setRange} />
      <HYSIAreaChart data={chartData} />
    </div>
  );
};
