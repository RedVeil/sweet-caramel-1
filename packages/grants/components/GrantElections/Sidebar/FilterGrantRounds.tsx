import { IGrantRoundFilter } from "pages/grant-elections/[type]";
import { Dispatch } from "react";

interface FilterGrantRoundsProps {
  grantRoundFilter: IGrantRoundFilter;
  setGrantRoundFilter: Dispatch<IGrantRoundFilter>;
}

const FilterGrantRounds: React.FC<FilterGrantRoundsProps> = ({ grantRoundFilter, setGrantRoundFilter }) => {
  function filterGrantRounds(key: "active" | "closed"): void {
    const shallow = { ...grantRoundFilter };
    shallow[key] = !shallow[key];
    setGrantRoundFilter(shallow);
  }

  return (
    <span className="flex flex-row items-center space-x-2">
      <p>Show:</p>
      {["active", "closed"].map((grantsRoundStatus: "active" | "closed") => (
        <label
          key={grantsRoundStatus}
          className="flex flex-row items-center space-x-1 cursor-pointer"
          htmlFor={`show-${grantsRoundStatus}-elections`}
          onClick={() => filterGrantRounds(grantsRoundStatus)}
        >
          <input
            id={`show-${grantsRoundStatus}-elections`}
            type="checkbox"
            checked={grantRoundFilter[grantsRoundStatus]}
            readOnly
          />
          <p>{grantsRoundStatus}</p>
        </label>
      ))}
    </span>
  );
};
export default FilterGrantRounds;
