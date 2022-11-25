import { BigNumber, Contract } from "ethers";
import { formatEther, formatUnits, parseEther, parseUnits } from "ethers/lib/utils";
import { getNamedAccounts } from "packages/utils";
import { resolve_price } from "../price-resolvers/resolve_price";

export async function synthetix(address, chainId, rpc?): Promise<{ value: BigNumber; decimals: number }> {
  const contract = new Contract(
    address,
    [
      "function rewardsDuration() external view returns (uint256)", // in seconds
      "function getRewardForDuration() external view returns (uint256)",
      "function totalSupply() external view returns (uint256)",
      "function stakingToken() external view returns (address)",
      "function rewardsToken() external view returns (address)",
    ],
    rpc,
  );

  const [rewardsDuration, rewardForDuration, totalSupply, stakingToken, rewardsToken] = await Promise.all([
    contract.rewardsDuration(),
    contract.getRewardForDuration(),
    contract.totalSupply(),
    contract.stakingToken(),
    contract.rewardsToken(),
  ]);

  console.log({ address, rewardsDuration, rewardForDuration, totalSupply, stakingToken, rewardsToken });
  let stakingTokenMetadata, rewardsTokenMetadata;
  try {
    [stakingTokenMetadata, rewardsTokenMetadata] = getNamedAccounts(chainId.toString() as any, [
      stakingToken as any,
      rewardsToken as any,
    ]);
    console.log({ OOOOO: true, stakingTokenMetadata, rewardsTokenMetadata, stakingToken, rewardsToken });
  } catch (e) {
    console.log({ CUSTOM_ERROR: e });
  }
  const [stakingTokenPrice, rewardsTokenPrice] = await Promise.all([
    resolve_price({ address: stakingToken, chainId, rpc }),
    resolve_price({ address: rewardsToken, chainId, rpc }),
  ]);

  console.log({
    address,
    stakingTokenPrice,
    rewardsTokenPrice,
    stakingTokenMetadata,
    rewardsTokenMetadata,
    PPPPPP: "XXXXXX",
  });
  const totalSupplyValue = totalSupply.mul(stakingTokenPrice.value).div(parseUnits("1", stakingTokenPrice.decimals));

  console.log({
    stakingTokenMetadata,
    rewardsTokenMetadata,
    totalSupplyValue,
    stakingTokenPrice,
    rewardsTokenPrice,
  });

  const rewardsValuePerPeriod = rewardForDuration
    .mul(rewardsTokenPrice.value)
    .div(parseUnits("1", rewardsTokenPrice.decimals));

  const rewardsValuePerYear = BigNumber.from(365 * 24 * 60 * 60)
    .div(rewardsDuration)
    .mul(rewardsValuePerPeriod);

  const apy = rewardsValuePerYear.mul(parseEther("100")).div(totalSupplyValue);

  console.log({
    apy: { formatted: formatEther(apy), value: apy },
    totalSupplyValue: { formatted: formatEther(totalSupplyValue), value: totalSupplyValue },
    rewardsValuePerPeriod: { formatted: formatEther(rewardsValuePerPeriod), value: rewardsValuePerPeriod },
    rewardsValuePerYear: { formatted: formatEther(rewardsValuePerYear), value: rewardsValuePerPeriod },
    rewardsDuration: { formatted: formatUnits(rewardsDuration, "0"), value: rewardsDuration },
    rewardForDuration: { formatted: formatEther(rewardForDuration), value: rewardForDuration },
    totalSupply: { formatted: formatEther(totalSupply), value: totalSupply },
    stakingToken,
    rewardsToken,
  });

  return { value: apy, decimals: 18 };
}
