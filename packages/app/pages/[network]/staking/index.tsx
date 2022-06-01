import { BellIcon } from "@heroicons/react/outline";
import { Address } from "@popcorn/utils/src/types";
import AlertCard, { AlertCardLink } from "components/Common/AlertCard";
import StakeCard from "components/StakeCard";
import { setMultiChoiceActionModal } from "context/actions";
import { FeatureToggleContext } from "context/FeatureToggleContext";
import { store } from "context/store";
import { ChainId } from "context/Web3/connectors";
import { constants } from "ethers";
import { ModalType, toggleModal } from "helper/modalHelpers";
import useGetMultipleStakingPools from "hooks/staking/useGetMultipleStakingPools";
import usePopLocker from "hooks/staking/usePopLocker";
import useWeb3 from "hooks/useWeb3";
import React, { useContext, useEffect, useState } from "react";
import ContentLoader from "react-content-loader";
import { NotAvailable } from "../../../components/Rewards/NotAvailable";

const TEMP_MIGRATION_LINKS: AlertCardLink[] = [
  {
    text: "Read More",
    url: "https://forum.popcorn.network/t/pip-2-liquidity-optimizations-and-use-of-treasury-funds/586",
    openInNewTab: true,
  },
  { text: "How to migrate", url: "/", openInNewTab: true },
];

export default function index(): JSX.Element {
  const {
    contractAddresses: { popStaking, staking, pop },
    chainId,
    pushWithinChain,
    account,
  } = useWeb3();
  const { dispatch } = useContext(store);
  const { data: popLocker, isValidating: popLockerIsValidating, error: popError } = usePopLocker(popStaking);
  const { data: stakingPools, isValidating: stakingPoolsIsValidating } = useGetMultipleStakingPools(staking);
  const [modalClosed, closeModal] = useState<boolean>(false);
  const { features } = useContext(FeatureToggleContext);

  useEffect(() => {
    if (account && chainId === ChainId.Polygon && stakingPools) {
      const popUsdcStaking = stakingPools?.find(
        (pools) => pools.address === "0xe6f315f4e0dB78185239fFFb368D6d188f6b926C",
      );
      const isStaking =
        popUsdcStaking?.userStake?.gt(constants.Zero) || popUsdcStaking?.withdrawable?.gt(constants.Zero);
      if (isStaking && !modalClosed) {
        toggleModal(
          ModalType.MultiChoice,
          {
            title: "Migrate your liquidity from Sushiswap to Gelato",
            content:
              "Please withdraw your LP tokens and deposit them into Gelato for the new liquidity mining rewards. In PIP-2 the community decided to consolidate all liquidity in Uniswap via Gelato. The purpose of this measure is to improve both liquidity a slippage. ",
            image: <img src="/images/butter/batch-popover.png" className="px-6" />,
            onConfirm: {
              label: "Close",
              onClick: () => {
                dispatch(setMultiChoiceActionModal(false)), closeModal(true);
              },
            },
            onDismiss: {
              label: "Do not remind me again",
              onClick: () => {
                localStorage.setItem("hideLiquidityMigrationModal", "true");
                dispatch(setMultiChoiceActionModal(false));
              },
            },
          },
          "hideLiquidityMigrationModal",
          dispatch,
        );
      }
    }
  }, [stakingPools, account, modalClosed]);

  const onSelectPool = (stakingContractAddress: Address, stakingTokenAddress: Address) => {
    if (stakingTokenAddress?.toLowerCase() === pop.toLowerCase()) {
      pushWithinChain("/staking/pop");
    } else {
      pushWithinChain(`/staking/${stakingContractAddress}`);
    }
  };

  const pageAvailable = () => {
    return ![ChainId.Arbitrum, ChainId.BNB].includes(chainId);
  };

  return (
    <>
      <div className="text-center md:text-left md:w-1/3">
        <h1 className="page-title">Staking</h1>
        <p className="md:text-lg text-gray-500 mt-2">Earn more by staking your tokens</p>
      </div>
      <div className="flex flex-row mt-10">
        <div className="hidden md:block w-1/3">
          <div className="bg-primaryLight rounded-5xl p-10 pt-44 pb-44 mr-12 mb-24 shadow-custom">
            <img src="/images/farmerCat.svg" alt="farmerCat" className="mx-auto transform scale-101 py-2" />
          </div>
        </div>
        <div className="w-full md:w-2/3 mx-auto">
          <div className="space-y-8 h-full">
            {!pageAvailable() && (
              <div className="flex flex-col w-full 3 md:mx-0 mt-10 mb-8 h-full">
                <NotAvailable title="No staking, yet" body="No staking pools on this network" />
              </div>
            )}
            {pageAvailable() && (stakingPoolsIsValidating || popLockerIsValidating) && (!popLocker || !stakingPools) && (
              <ContentLoader viewBox="0 0 450 400">
                {/*eslint-disable */}
                <rect x="0" y="0" rx="15" ry="15" width="450" height="108" />
                <rect x="0" y="115" rx="15" ry="15" width="450" height="108" />
                <rect x="0" y="230" rx="15" ry="15" width="450" height="108" />
                {/*eslint-enable */}
              </ContentLoader>
            )}
            {pageAvailable() && !!popLocker && !!stakingPools && (
              <>
                {features["migrationAlert"] && chainId === ChainId.Polygon && (
                  <AlertCard
                    title="Migrate your liquidity for USDC/POP from Sushiswap to Gelato"
                    text="In PIP-2 the community decided to consolidate all liquidity in Uniswap via Gelato."
                    icon={<BellIcon className="text-red-400 w-7 h-8" aria-hidden="true" />}
                    links={TEMP_MIGRATION_LINKS}
                  />
                )}
                <StakeCard
                  key={popLocker.address}
                  stakingPool={popLocker}
                  stakedToken={popLocker.stakingToken}
                  onSelectPool={onSelectPool}
                />
                {stakingPools?.map((stakingPool) => (
                  <div key={stakingPool.address}>
                    <StakeCard
                      stakingPool={stakingPool}
                      stakedToken={stakingPool.stakingToken}
                      onSelectPool={onSelectPool}
                      badge={
                        features["migrationAlert"] &&
                        stakingPool.address === "0xe6f315f4e0dB78185239fFFb368D6d188f6b926C"
                          ? {
                              text: "Migration Required",
                              textColor: "text-white",
                              bgColor: "bg-red-500",
                            }
                          : undefined
                      }
                    />
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
