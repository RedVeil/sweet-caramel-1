import { ChainId } from "packages/utils";
import { useEffect } from "react";
import { useApy } from "../hooks/useApy";
import { UpdateTokenActionProps } from "../reducers/portfolio";

interface ApyProps {
  address: string;
  chainId: ChainId;
  resolver?: string;
  updateToken?: (args: UpdateTokenActionProps) => void;
}
export const Apy: React.FC<ApyProps> = ({ address, chainId, resolver, updateToken }) => {
  const { data, isValidating, error: apyError } = useApy({ address, chainId, resolver });
  const loading = !data?.value && isValidating;

  useEffect(() => {
    if (apyError)
      console.log({ apyError, address, chainId, resolver })
  }, [apyError]);

  return (
    <>
      {loading && "Loading ..."}
      {data?.value && <div>APY: {data?.formatted} </div>}
    </>
  );
};
