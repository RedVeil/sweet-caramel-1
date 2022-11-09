import { ChainId, networkLogos } from "@popcorn/utils"

interface SelectNetworkProps {
  supportedNetworks: ChainId[];
  selectedNetworks: ChainId[];
  selectNetwork: (chainId: ChainId) => void;
}

export default function SelectNetwork({ supportedNetworks, selectedNetworks, selectNetwork }: SelectNetworkProps): JSX.Element {
  return (
    <div className="flex flex-row items-center space-x-2">
      <p className="text-lg mr-4">Selected Networks:</p>
      {supportedNetworks.map(network =>
        <button key={network}
          onClick={() => selectNetwork(network)}
          className={`${selectedNetworks.includes(network) ? "bg-warmGray" : "bg-white"} h-8 w-12 border border-customLightGray rounded-4xl text-primary cursor-pointer`}>
          <img src={networkLogos[network]} alt={ChainId[network]} className="w-4.5 h-4 mx-auto" />
        </button>
      )}
    </div>
  )
}