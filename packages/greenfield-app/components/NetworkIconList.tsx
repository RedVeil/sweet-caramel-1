import { networkLogos } from "@popcorn/utils";

// TODO: replace `img` elements with next/image
type NetworkIconListProps = {
  networks: Array<number | string>;
};

const ALL_NETWORKS_ID = 0;
function NetworkIconList({ networks }: NetworkIconListProps) {
  return (
    <div className="relative flex items-center -space-x-1">
      {networks.map((networkID) => {
        return networkID == ALL_NETWORKS_ID ? null : (
          <div key={`network-logo-item-${networkID}`} className="relative">
            <img src={networkLogos[networkID]} alt="network logo" className="w-6 h-6" />
          </div>
        );
      })}
    </div>
  );
}

export default NetworkIconList;
