import type { Pop } from "@popcorn/components/lib/types";
import React from "react";
import { useAccount, useContractReads } from "wagmi";

import { useSupportedContracts } from "@popcorn/components/hooks";

import PortfolioItemsContainer from "./PortfolioItemsContainer";
import PortfolioSectionHeader from "./PortfolioSectionHeader";

type PortfolioRewardsProps = {
  selectedNetworks: any;
};

const PortfolioRewards = ({ selectedNetworks }: PortfolioRewardsProps) => {
  const { address: account } = useAccount();
  const supportedContracts = useSupportedContracts(selectedNetworks);
  const claimableRewardContracts = useFilterRewardContracts(supportedContracts, account);

  return (
    <div>
      <PortfolioSectionHeader sectionTitle="Rewards" selectedContracts={supportedContracts}>
        {claimableRewardContracts.map((token, i) => {
          return (
            <PortfolioItemsContainer
              index={i}
              // TODO: remove `@index` as it's not used in component implementation
              alias={token.__alias}
              key={`reward-${token.chainId}:${token.address}`}
              chainId={Number(token.chainId)}
              address={token.address}
              account={account}
            />
          );
        })}
      </PortfolioSectionHeader>
    </div>
  );
};

function useFilterRewardContracts(
  contractList: Pop.NamedAccountsMetadata[],
  holderAddress?: string,
): Array<Pop.NamedAccountsMetadata & { address: string }> {
  // TODO: add later a hook to consume one's rewards along with claimableBalance?

  const formattedContractCalls = contractList.map(({ address, chainId, balanceResolver }) => {
    const isEscrowContract = balanceResolver === "escrowBalance";
    return {
      address,
      chainId: Number(chainId),
      abi: [
        "function getClaimableAmount(bytes32) external view returns (uint256)",
        "function earned(address) external view returns (uint256)",
      ],
      functionName: isEscrowContract ? "getClaimableAmount" : "earned",
      args: [holderAddress],
    };
  });

  const { data: claimableContracts = [] } = useContractReads({
    cacheOnBlock: true,
    contracts: formattedContractCalls,
    select: (data) => {
      // format data to return the contract where the user has balance on
      const fetchedData = data.map((holderBalance, index) => {
        const contract = contractList[index];
        return {
          ...contract,
          holderBalance,
        };
      });
      // Filter only for values in `holderBalance` gt ZERO
      return fetchedData.filter(({ holderBalance }: { holderBalance: any }) => holderBalance?.gt(0));
    },
  });

  return claimableContracts as any;
}

export default PortfolioRewards;
