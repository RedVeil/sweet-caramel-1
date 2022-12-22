import type { ContractMetadata } from "@popcorn/utils/src/types";

import useContractMetadata from "./hooks/useContractMetadata";

interface ContractProps {
  alias?: string;
  address?: string;
  chainId: number;
  children: (metadata?: ContractMetadata) => React.ReactElement;
}

export const Metadata: React.FC<ContractProps> = ({ address, chainId, alias, children }) => {
  const { data, status } = useContractMetadata({ chainId, address, alias });
  return children(data);
};

export default Metadata;
