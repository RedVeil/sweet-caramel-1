import useGetMultipleStakingPools from "@popcorn/app/hooks/staking/useGetMultipleStakingPools";
import usePopLocker from "@popcorn/app/hooks/staking/usePopLocker";
import { useDeployment } from "@popcorn/app/hooks/useDeployment";
import { useStakingContracts } from "@popcorn/app/hooks/useStakingContracts";
import { ChainId } from "@popcorn/utils";
import { PopLockerMetadata, StakingPoolMetadata } from "@popcorn/utils/getStakingPool";

interface NetworkStakingContracts {
  popStaking: PopLockerMetadata;
  stakingPools: StakingPoolMetadata[];
}

interface StakingContracts {
  ethereum: NetworkStakingContracts;
  polygon: NetworkStakingContracts;
  localhost: NetworkStakingContracts;
  popStaking: PopLockerMetadata[];
  stakingPools: StakingPoolMetadata[];
}

export default function useAllStakingContracts(): StakingContracts {
  // Ethereum
  const { popStaking: ethereumPopStaking } = useDeployment(ChainId.Ethereum);
  const { data: ethereumPopLocker, isValidating: ethereumPopLockerIsValidating, error: ethereumPopLockerError } = usePopLocker(ethereumPopStaking, ChainId.Ethereum);
  const ethereumStakingAddresses = useStakingContracts(ChainId.Ethereum);
  const { data: ethereumStakingPools, isValidating: ethereumStakingPoolsIsValidating } = useGetMultipleStakingPools(
    ethereumStakingAddresses,
    ChainId.Ethereum,
  );

  // Polygon
  const { popStaking: polygonPopStaking } = useDeployment(ChainId.Polygon);
  const { data: polygonPopLocker, isValidating: polygonPopLockerIsValidating, error: polygonPopLockerError } = usePopLocker(polygonPopStaking, ChainId.Polygon);
  const polygonStakingAddresses = useStakingContracts(ChainId.Polygon);
  const { data: polygonStakingPools, isValidating: polygonStakingPoolsIsValidating } = useGetMultipleStakingPools(
    polygonStakingAddresses,
    ChainId.Polygon,
  );

  // TODO how to not fetch if node is not running?
  // Localhost
  const { popStaking: localhostPopStaking } = useDeployment(ChainId.Localhost);
  const { data: localhostPopLocker, isValidating: localhostPopLockerIsValidating, error: localhostPopLockerError } = usePopLocker(localhostPopStaking, ChainId.Localhost);
  const localhostStakingAddresses = useStakingContracts(ChainId.Localhost);
  const { data: localhostStakingPools, isValidating: localhostStakingPoolsIsValidating } = useGetMultipleStakingPools(
    localhostStakingAddresses,
    ChainId.Localhost,
  );

  const popLocker = [ethereumPopLocker, polygonPopLocker, localhostPopLocker]
  const stakingPools = ethereumStakingPools?.concat(polygonStakingPools, localhostStakingPools)

  return {
    ethereum: {
      popStaking: ethereumPopLocker,
      stakingPools: ethereumStakingPools
    },
    polygon: {
      popStaking: polygonPopLocker,
      stakingPools: polygonStakingPools
    },
    localhost: {
      popStaking: localhostPopLocker,
      stakingPools: localhostStakingPools
    },
    popStaking: popLocker,
    stakingPools: stakingPools
  }
}