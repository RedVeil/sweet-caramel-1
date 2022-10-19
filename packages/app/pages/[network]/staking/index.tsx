import { ChainId } from "@popcorn/utils";
import { Address } from "@popcorn/utils/src/types";
import AlertCard, { AlertCardLink } from "components/Common/AlertCard";
import ConnectDepositCard from "components/Common/ConnectDepositCard";
import StakeCard from "components/StakeCard";
import { setMultiChoiceActionModal } from "context/actions";
import { FeatureToggleContext } from "context/FeatureToggleContext";
import { store } from "context/store";
import { constants } from "ethers";
import { ModalType, toggleModal } from "helper/modalHelpers";
import useGetMultipleStakingPools from "hooks/staking/useGetMultipleStakingPools";
import usePopLocker from "hooks/staking/usePopLocker";
import { useDeployment } from "hooks/useDeployment";
import { useStakingContracts } from "hooks/useStakingContracts";
import useWeb3 from "hooks/useWeb3";
import React, { useContext, useEffect, useState } from "react";
import ContentLoader from "react-content-loader";
import { NotAvailable } from "../../../components/Rewards/NotAvailable";
import { useChainIdFromUrl } from "../../../hooks/useChainIdFromUrl";

const MIGRATION_LINKS: AlertCardLink[] = [
  { text: "How to migrate", url: "https://medium.com/popcorndao/pop-on-arrakis-8a7d7d7f1948", openInNewTab: true },
];

export default function index(): JSX.Element {
  const { pushWithinChain, account } = useWeb3();
  const chainId = useChainIdFromUrl();
  const { pop, popStaking, popUsdcArrakisVaultStaking } = useDeployment(chainId);
  const stakingAddresses = useStakingContracts(chainId);
  const { dispatch } = useContext(store);
  const { data: popLocker, isValidating: popLockerIsValidating, error: popError } = usePopLocker(popStaking, chainId);
  const { data: stakingPools, isValidating: stakingPoolsIsValidating } = useGetMultipleStakingPools(stakingAddresses, chainId);
  const [modalClosed, closeModal] = useState<boolean>(false);
  const { features } = useContext(FeatureToggleContext);

  const displayedStakingPools = features["migrationAlert"]
    ? stakingPools
    : stakingPools?.filter((pool) => pool.address !== popUsdcArrakisVaultStaking);

  useEffect(() => {
    if (account && chainId === ChainId.Polygon && stakingPools) {
      const popUsdcStaking = stakingPools?.find(
        (pools) => pools.address === "0xe6f315f4e0dB78185239fFFb368D6d188f6b926C",
      );
      const userHasPopUsdcLpStakes =
        popUsdcStaking?.userStake?.gt(constants.Zero) || popUsdcStaking?.withdrawable?.gt(constants.Zero);
      if (userHasPopUsdcLpStakes && !modalClosed) {
        toggleModal(
          ModalType.MultiChoice,
          {
            title: "Migrate your liquidity from Sushiswap to Arrakis",
            content:
              "Please withdraw your LP tokens and deposit them into Arrakis for the new liquidity mining rewards. In PIP-2 the community decided to migrate all Polygon liquidity to Uniswap via Arrakis. The purpose of this measure is to improve both liquidity and slippage. ",
            image: <img src="/images/modalImages/migrate.svg" />,
            onConfirm: {
              label: "Continue",
              onClick: () => {
                dispatch(setMultiChoiceActionModal(false));
                closeModal(true);
              },
            },
            onDontShowAgain: {
              label: "Do not remind me again",
              onClick: () => {
                localStorage.setItem("hideLiquidityMigrationModal", "true");
                dispatch(setMultiChoiceActionModal(false));
              },
            },
            onDismiss: {
              onClick: () => {
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
      <div className="grid grid-cols-12">
        <div className="col-span-12 md:col-span-4">
          <h1 className=" text-5xl md:text-6xl leading-12">Staking</h1>
          <p className="text-black mt-2">Earn more by staking your tokens</p>
        </div>
        <div className="col-span-12 md:col-span-6 md:col-end-13 mt-12 md:mt-0">
          <ConnectDepositCard />
        </div>
      </div>
      {features["migrationAlert"] && chainId === ChainId.Polygon && (
        <div className="mt-10 md:mt-20">
          <AlertCard
            title="Migrate your liquidity for USDC/POP from Sushiswap to Arrakis"
            text="In PIP-2 the community decided to migrate all Polygon liquidity to Uniswap via Arrakis."
            links={MIGRATION_LINKS}
          />
        </div>
      )}
      <div className="mt-12 border-t border-t-customLightGray">
        <div className="w-full">
          <div className="h-full">
            {!pageAvailable() && (
              <div className="flex flex-col w-full 3 md:mx-0 mt-10 mb-8 h-full">
                <NotAvailable title="No staking, yet" body="No staking pools on this network" />
              </div>
            )}
            {pageAvailable() && (stakingPoolsIsValidating || popLockerIsValidating) && (!popLocker || !stakingPools) && (
              <div className="mt-10">
                <ContentLoader viewBox="0 0 450 400" backgroundColor={"#EBE7D4"} foregroundColor={"#d7d5bc"}>
                  {/*eslint-disable */}
                  <rect x="0" y="0" rx="8" ry="8" width="450" height="108" />
                  <rect x="0" y="115" rx="8" ry="8" width="450" height="108" />
                  <rect x="0" y="230" rx="8" ry="8" width="450" height="108" />
                  {/*eslint-enable */}
                </ContentLoader>
              </div>
            )}
            {pageAvailable() && !!popLocker && !!stakingPools && (
              <>
                <StakeCard
                  chainId={chainId}
                  key={popLocker.address}
                  stakingPool={popLocker}
                  stakedToken={popLocker.stakingToken}
                  onSelectPool={onSelectPool}
                />
                {displayedStakingPools?.map((stakingPool) => (
                  <div key={stakingPool.address}>
                    <StakeCard
                      chainId={chainId}
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
      {/* <FooterLandScapeImage /> */}
    </>
  );
}
