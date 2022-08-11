import { getChainRelevantContracts } from "@popcorn/hardhat/lib/utils/getContractAddresses";
import { bigNumberToNumber, ChainId, localStringOptions } from "@popcorn/utils";
import { InfoIconWithTooltip } from "components/InfoIconWithTooltip";
import { constants } from "ethers";
import { formatUnits } from "ethers/lib/utils";
import useGetYearnAPY from "hooks/set/useGetYearnAPY";
import useSetTokenTVL from "hooks/set/useSetTokenTVL";
import useStakingPool from "hooks/staking/useStakingPool";
import useStakingTVL from "hooks/staking/useStakingTVL";
import { useRouter } from "next/router";
import React from "react";
import Product from "./Product";

const Products = () => {
  const router = useRouter();
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
        <Product
          title="Sweet Vaults"
          description="Single-asset vaults to earn yield on your digital assets"
          stats={[
            {
              title: "TVL",
              content: "$3.7m",
              infoIcon: {
                title: "Total Value Locked",
                content: "The amount of user funds deposited in Sweet Vaults.",
                id: "sweet-vault-tvl",
              },
            },
          ]}
          route="sweet-vaults"
          badge="/images/newProductBadge.svg"
        />
        <Product
          title="3x"
          description="EUR & USD exposure with noble yield that funds social impact organizations"
          stats={[
            {
              title: "TVL",
              content: threeXTVL ? `$${formatter.format(parseInt(formatUnits(threeXTVL)))}` : "$0",
              infoIcon: {
                title: "Total Value Locked",
                content: "The amount of user funds deposited in BTR.",
                id: "btr-tvl",
              },
            },
            {
              title: "vAPR",
              content:
                threeXAPY && threeXStaking && threeXStaking?.apy?.gte(constants.Zero)
                  ? `${(threeXAPY + bigNumberToNumber(threeXStaking.apy)).toLocaleString(
                      undefined,
                      localStringOptions,
                    )}%`
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
                content: "The amount of user funds deposited in BTR.",
                id: "btr-tvl",
              },
            },
            {
              title: "vAPR",
              content:
                butterAPY && butterStaking && butterStaking?.apy?.gte(constants.Zero)
                  ? `${(butterAPY + bigNumberToNumber(butterStaking.apy)).toLocaleString(
                      undefined,
                      localStringOptions,
                    )}%`
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
                content: "The amount of user funds deposited in BTR.",
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

const ButterExposure: React.ReactElement = (
  <>
    <div className="flex gap-2">
      <p className="text-primaryLight">Exposure</p>
      <InfoIconWithTooltip
        classExtras=""
        id="butter-exposure"
        title="Underlying Tokens"
        content="25.00% yvCurve-FRAX
      25.00% yvCurve-RAI
      25.00% yvCurve-mUSD
      25.00% yvCurve-alUSD
      
      BTR Has Exposure to: FRAX, RAI, mUSD, alUSD, sUSD and 3CRV (USDC/DAI/USDT)."
      />
    </div>
    <div className="flex relative mt-1">
      <img src="/images/tokens/usdt.svg" alt="" className="h-10 w-10 rounded-full relative" />
      <img src="/images/tokens/Group 1104.svg" alt="" className={`h-10 w-10 rounded-full relative -left-2`} />
      <img
        src="/images/tokens/multi-collateral-dai-dai-logo 1.svg"
        alt=""
        className="h-10 w-10 rounded-full relative -left-4"
      />
      <img src="/images/tokens/susd 1.svg" alt="" className="h-10 w-10 rounded-full relative -left-6" />
      <img src="/images/tokens/usd-coin-usdc-logo.svg" alt="" className="h-10 w-10 rounded-full relative -left-8" />
      <img src="/images/tokens/sLogo.svg" alt="" className="h-10 w-10 rounded-full relative -left-10" />
      <img src="/images/tokens/sDiamondLogo.svg" alt="" className="h-10 w-10 rounded-full relative -left-12" />
      <img src="/images/tokens/boltLogo.svg" alt="" className="h-10 w-10 rounded-full relative -left-14" />
      <img src="/images/tokens/clogo.svg" alt="" className="h-10 w-10 rounded-full relative -left-16" />
      <img src="/images/tokens/RAI.svg" alt="" className="h-10 w-10 rounded-full relative -left-18" />
    </div>
  </>
);

const ThreeXExposure: React.ReactElement = (
  <>
    <div className="flex gap-2">
      <p className="text-primaryLight">Exposure</p>
      <InfoIconWithTooltip
        classExtras=""
        id="3x-exposure"
        title="Underlying Tokens"
        content="50% yvCurve-sUSDpool
50% yvCurve-3EURpool
3X Has Exposure to: sUSD, DAI, USDC, USDT, agEUR, EURT, and EURS."
      />
    </div>
    <div className="flex relative mt-1">
      <img src="/images/tokens/usdt.svg" alt="" className="h-10 w-10 rounded-full relative" />
      <img src="/images/tokens/Group 1104.svg" alt="" className={`h-10 w-10 rounded-full relative -left-2`} />
      <img src="/images/tokens/Group 1108.svg" alt="" className="h-10 w-10 rounded-full relative -left-4" />
      <img
        src="/images/tokens/multi-collateral-dai-dai-logo 1.svg"
        alt=""
        className="h-10 w-10 rounded-full relative -left-6"
      />
      <img src="/images/tokens/susd 1.svg" alt="" className="h-10 w-10 rounded-full relative -left-8" />
      <img src="/images/tokens/usd-coin-usdc-logo.svg" alt="" className="h-10 w-10 rounded-full relative -left-10" />
    </div>
  </>
);

export default Products;
