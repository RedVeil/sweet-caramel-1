import { ChainId, PRC_PROVIDERS } from "@popcorn/utils";
import { BigNumber, constants, Contract, ethers } from "ethers";
import { parseEther } from "ethers/lib/utils";
import useSWR, { SWRResponse } from "swr";

export async function getSetTokenValue(
  setTokenAddress: string,
  batchContract: Contract,
  rpcProvider,
): Promise<BigNumber> {
  const basicIssuanceModule = new ethers.Contract(
    "0xd8EF3cACe8b4907117a45B0b125c68560532F94D",
    [
      "function getRequiredComponentUnitsForIssue(address setToken, uint256 amount) external view returns(address[], uint256[])",
    ],
    rpcProvider,
  );

  const requiredComponentsForIssue = await basicIssuanceModule.getRequiredComponentUnitsForIssue(
    setTokenAddress,
    parseEther("1"),
  );
  // SetToken price
  return batchContract.valueOfComponents(...requiredComponentsForIssue);
}

export async function getSetTokenTVL(
  key,
  setTokenAddress: string,
  batchAddress: string,
  rpcProvider,
): Promise<BigNumber> {
  const batchContract = new ethers.Contract(
    batchAddress,
    [
      "function valueOfComponents(address[] memory _tokenAddresses, uint256[] memory _quantities) public view returns (uint256)",
    ],
    rpcProvider,
  );
  const setToken = new ethers.Contract(
    setTokenAddress,
    ["function totalSupply() external view returns (uint256)"],
    rpcProvider,
  );
  const totalSupply = await setToken.totalSupply();
  const setValue = await getSetTokenValue(setTokenAddress, batchContract, rpcProvider);
  return totalSupply.mul(setValue).div(constants.WeiPerEther);
}

export default function useSetTokenTVL(setTokenAddress: string, batchAddress: string): SWRResponse<BigNumber, Error> {
  return useSWR(
    [`getSetTokenTVL-${setTokenAddress}`, setTokenAddress, batchAddress, PRC_PROVIDERS[ChainId.Ethereum]],
    getSetTokenTVL,
    {
      refreshInterval: 3 * 1000,
      dedupingInterval: 3 * 1000,
    },
  );
}
