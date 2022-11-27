import { ChainId } from "packages/utils";
import { useApy } from "../hooks/useApy";
import useLog from "../hooks/utils/useLog";

interface ApyProps {
  address: string;
  chainId: ChainId;
  resolver?: string;
}
export const Apy: React.FC<ApyProps> = ({ address, chainId, resolver }) => {
  const { data, isValidating, error: apyError } = useApy({ address, chainId, resolver });

  const loading = !data?.value && isValidating;

  useLog({ apyError }, [apyError]);

  return (
    <>
      {loading && "Loading ..."}
      {data?.value && <div>APY: {data?.formatted} </div>}
    </>
  );
};
