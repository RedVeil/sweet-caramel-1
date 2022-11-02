import { getChainRelevantContracts } from "@popcorn/hardhat/lib/utils/getContractAddresses";
import { ChainId, formatAndRoundBigNumber } from "@popcorn/utils";
import { InfoIconWithTooltip } from "@popcorn/app/components/InfoIconWithTooltip";
import { constants } from "ethers";
import { formatUnits, parseUnits } from "ethers/lib/utils";
import useGetYearnAPY from "@popcorn/app/hooks/set/useGetYearnAPY";
import useSetTokenTVL from "@popcorn/app/hooks/set/useSetTokenTVL";
import useStakingPool from "@popcorn/app/hooks/staking/useStakingPool";
import useStakingTVL from "@popcorn/app/hooks/staking/useStakingTVL";
import React from "react";
import Product from "./Product";

const Products = () => {
  const contractAddresses = getChainRelevantContracts(ChainId.Ethereum);
  const { data: threeXAPY } = useGetYearnAPY([contractAddresses.ySusd, contractAddresses.y3Eur]);
  const { data: butterAPY } = useGetYearnAPY([
    contractAddresses.yFrax,
    contractAddresses.yRai,
    contractAddresses.yMusd,
    contractAddresses.yAlusd,
  ]);
  const { data: threeXStaking } = useStakingPool(contractAddresses.threeXStaking);
  const { data: butterStaking } = useStakingPool(contractAddresses.butterStaking);
  const { data: mainnetStakingTVL } = useStakingTVL(ChainId.Ethereum);
  const { data: polygonStakingTVL } = useStakingTVL(ChainId.Polygon);
  const { data: butterTVL } = useSetTokenTVL(contractAddresses.butter, contractAddresses.butterBatch);
  const { data: threeXTVL } = useSetTokenTVL(contractAddresses.threeX, contractAddresses.threeXBatch);

  const formatter = Intl.NumberFormat("en", {
    //@ts-ignore
    notation: "compact",
  });

  return (
    <section className="mt-10">
      <h6 className="font-medium leading-8 mb-4">Our Products</h6>
      <div className="border-t border-customLightGray">
        {process.env.SHOW_SWEETVAULTS && (
          <Product
            title="Sweet Vaults"
            description="Single-asset vaults to earn yield on your digital assets"
            stats={[
              {
                title: "TVL",
                content: "$3.7m",
                infoIcon: {
                  title: "Total Value Locked",
                  content: "TThe total value of assets held by the underlying smart contracts.",
                  id: "sweet-vault-tvl",
                },
              },
            ]}
            route="sweet-vaults"
            badge="/images/newProductBadge.svg"
          />
        )}
        <Product
          title="3X"
          description="EUR & USD exposure with noble yield that funds social impact organizations"
          stats={[
            {
              title: "TVL",
              content: threeXTVL ? `$${formatter.format(parseInt(formatUnits(threeXTVL)))}` : "$0",
              infoIcon: {
                title: "Total Value Locked",
                content: "The total value of assets held by the underlying smart contracts.",
                id: "btr-tvl",
              },
            },
            {
              title: "vAPR",
              content:
                threeXAPY && threeXStaking && threeXStaking?.apy?.gte(constants.Zero)
                  ? `${formatAndRoundBigNumber(threeXStaking.apy.add(parseUnits(String(threeXAPY))), 18)}%`
                  : "New 🍿✨",
              infoIcon: {
                title: "Variable Annual Percentage Rate",
                content:
                  "This shows your interest stated as a yearly percentage rate, which is subject to change over time based on demand and market conditions.",
                id: "3x-vapr",
              },
            },
          ]}
          route="set/3x"
          customContent={ThreeXExposure}
          badge="/images/fireProductBadge.svg"
        />
        <Product
          title="Butter"
          description="Optimize your yield while creating positive global impact."
          stats={[
            {
              title: "TVL",
              content: butterTVL ? `$${formatter.format(parseInt(formatUnits(butterTVL)))}` : "$0",
              infoIcon: {
                title: "Total Value Locked",
                content: "The total value of assets held by the underlying smart contracts.",
                id: "btr-tvl",
              },
            },
            {
              title: "vAPR",
              content:
                butterAPY && butterStaking && butterStaking?.apy?.gte(constants.Zero)
                  ? `${formatAndRoundBigNumber(butterStaking.apy.add(parseUnits(String(butterAPY))), 18)}%`
                  : "New 🍿✨",
              infoIcon: {
                title: "Variable Annual Percentage Rate",
                content:
                  "This shows your interest stated as a yearly percentage rate, which is subject to change over time based on demand and market conditions.",
                id: "btr-vapr",
              },
            },
          ]}
          route="set/butter"
          customContent={ButterExposure}
        />
        <Product
          title="Staking"
          description="Single-asset vaults to earn yield on your digital assets"
          stats={[
            {
              title: "TVL",
              content:
                mainnetStakingTVL && polygonStakingTVL
                  ? `$${formatter.format(parseInt(formatUnits(mainnetStakingTVL.add(polygonStakingTVL))))}`
                  : "$0",
              infoIcon: {
                title: "Total Value Locked",
                content: "The total value of assets held by the underlying smart contracts.",
                id: "staking-tvl",
              },
            },
          ]}
          route="staking"
        />
      </div>
    </section>
  );
};

const ButterExposure: JSX.Element = (
  <>
    <div className="flex gap-2 md:gap-0 md:space-x-2">
      <p className="text-primaryLight">Exposure</p>
      <InfoIconWithTooltip
        classExtras=""
        id="butter-exposure"
        title="Underlying Tokens"
        content="25.00% yvCurve-FRAX
      25.00% yvCurve-RAI
      25.00% yvCurve-mUSD
      25.00% yvCurve-alUSD
      
      BTR has exposure to: FRAX, RAI, mUSD, alUSD, sUSD and 3CRV (USDC/DAI/USDT)."
      />
    </div>
    <div className="flex relative mt-1">
      <img
        src="/images/tokens/boltLogo.svg"
        alt=""
        className="md:h-9 h-10 w-10 md:w-9 laptop:h-10 laptop:w-10 rounded-full relative"
      />
      <img
        src="/images/tokens/sUnderscore.svg"
        alt=""
        className="md:h-9 h-10 w-10 md:w-9 laptop:h-10 laptop:w-10 rounded-full relative -left-2"
      />
      <img
        src="/images/tokens/RAI.svg"
        alt=""
        className="md:h-9 h-10 w-10 md:w-9 laptop:h-10 laptop:w-10 rounded-full relative -left-4"
      />
      <img
        src="/images/tokens/sLogo.svg"
        alt=""
        className="md:h-9 h-10 w-10 md:w-9 laptop:h-10 laptop:w-10 rounded-full relative -left-6"
      />
      <img
        src="/images/tokens/sDiamondLogo.svg"
        alt=""
        className="md:h-9 h-10 w-10 md:w-9 laptop:h-10 laptop:w-10 rounded-full relative -left-8"
      />
      <img
        src="/images/tokens/threeCrv.svg"
        alt=""
        className="md:h-9 h-10 w-10 md:w-9 laptop:h-10 laptop:w-10 rounded-full relative -left-10"
      />
    </div>
  </>
);

const ThreeXExposure: JSX.Element = (
  <>
    <div className="flex gap-2 md:gap-0 md:space-x-2">
      <p className="text-primaryLight">Exposure</p>
      <InfoIconWithTooltip
        classExtras=""
        id="3x-exposure"
        title="Underlying Tokens"
        content="50% yvCurve-sUSDpool
50% yvCurve-3EURpool
3X has exposure to: sUSD, DAI, USDC, USDT, agEUR, EURT, and EURS."
      />
    </div>
    <div className="flex relative mt-1">
      <img
        src="/images/tokens/usdt.svg"
        alt=""
        className="md:h-9 h-10 w-10 md:w-9 laptop:h-10 laptop:w-10 rounded-full relative"
      />
      <img
        src="/images/tokens/Group 1104.svg"
        alt=""
        className={`md:h-9 h-10 w-10 md:w-9 laptop:h-10 laptop:w-10 rounded-full relative -left-2`}
      />
      <img
        src="/images/tokens/ageur.svg"
        alt=""
        className="md:h-9 h-10 w-10 md:w-9 laptop:h-10 laptop:w-10 rounded-full relative -left-4"
      />
      <img
        src="/images/tokens/multi-collateral-dai-dai-logo 1.svg"
        alt=""
        className="md:h-9 h-10 w-10 md:w-9 laptop:h-10 laptop:w-10 rounded-full relative -left-6"
      />
      <img
        src="/images/tokens/susd 1.svg"
        alt=""
        className="md:h-9 h-10 w-10 md:w-9 laptop:h-10 laptop:w-10 rounded-full relative -left-8"
      />
      <img
        src="/images/tokens/usd-coin-usdc-logo.svg"
        alt=""
        className="md:h-9 h-10 w-10 md:w-9 laptop:h-10 laptop:w-10 rounded-full relative -left-10"
      />
      <img
        src="/images/tokens/tether-usdt-logo.svg"
        alt=""
        className="md:h-9 h-10 w-10 md:w-9 laptop:h-10 laptop:w-10 rounded-full relative -left-12"
      />
    </div>
  </>
);

export default Products;
