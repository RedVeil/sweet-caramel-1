import useGetMultipleStakingPools from "@popcorn/app/hooks/staking/useGetMultipleStakingPools";
import usePopLocker from "@popcorn/app/hooks/staking/usePopLocker";
import { useDeployment } from "@popcorn/app/hooks/useDeployment";
import { useStakingContracts } from "@popcorn/app/hooks/useStakingContracts";
import { ChainId } from "@popcorn/utils";

export enum StakingType {
  PopLocker,
  StakingPool
}

export default function useAllStakingContracts() {
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

  return {
    stakingPoolsIsValidating:
      ethereumPopLockerIsValidating || polygonPopLockerIsValidating || localhostPopLockerIsValidating || polygonStakingPoolsIsValidating || ethereumStakingPoolsIsValidating || localhostStakingPoolsIsValidating,
    stakingPools: [
      { chainId: ChainId.Ethereum, stakingType: StakingType.PopLocker, pool: ethereumPopLocker } || {},
      { chainId: ChainId.Polygon, stakingType: StakingType.PopLocker, pool: polygonPopLocker } || {},
      { chainId: ChainId.Localhost, stakingType: StakingType.PopLocker, pool: localhostPopLocker } || {},
      ...(ethereumStakingPools?.length ? ethereumStakingPools : []).map(
        (pool) => ({ chainId: ChainId.Ethereum, stakingType: StakingType.StakingPool, pool } || {}),
      ),
      ...(polygonStakingPools?.length ? polygonStakingPools : []).map(
        (pool) => ({ chainId: ChainId.Polygon, stakingType: StakingType.StakingPool, pool } || {}),
      ),
      ...(localhostStakingPools?.length ? localhostStakingPools : []).map(
        (pool) => ({ chainId: ChainId.Localhost, stakingType: StakingType.StakingPool, pool } || {}),
      ),
    ],
  };
}