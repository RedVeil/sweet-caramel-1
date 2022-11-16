import { useContext, useState, useEffect } from "react";
import { FeatureToggleContext } from "context/FeatureToggleContext";
import { ChainId, networkMap } from "@popcorn/utils";

const networkData = [
  {
    id: JSON.stringify(ChainId.Ethereum),
    value: networkMap[ChainId.Ethereum],
  },
  {
    id: JSON.stringify(ChainId.Arbitrum),
    value: networkMap[ChainId.Arbitrum],
  },
  {
    id: JSON.stringify(ChainId.BNB),
    value: networkMap[ChainId.BNB],
  },
  {
    id: JSON.stringify(ChainId.Polygon),
    value: networkMap[ChainId.Polygon],
  },
];

const useAvailableNetworks = () => {
  const [availableNetworks, setAvailableNetworks] = useState(networkData);
  const { showLocalNetwork } = useContext(FeatureToggleContext).features;

  useEffect(() => {
    if (showLocalNetwork && availableNetworks.length <= networkData.length) {
      setAvailableNetworks([
        ...availableNetworks,
        {
          id: JSON.stringify(ChainId.Goerli),
          value: networkMap[ChainId.Goerli],
        },
        {
          id: JSON.stringify(ChainId.Localhost),
          value: networkMap[ChainId.Localhost],
        },
      ]);
    }
  }, []);

  return {
    availableNetworks,
  };
};

export default useAvailableNetworks;
