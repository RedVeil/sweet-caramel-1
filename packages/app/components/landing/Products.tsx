import { getChainRelevantContracts } from "@popcorn/hardhat/lib/utils/getContractAddresses";
import { bigNumberToNumber, ChainId, localStringOptions } from "@popcorn/utils";
import { InfoIconWithTooltip } from "components/InfoIconWithTooltip";
import MainActionButton from "components/MainActionButton";
import { constants } from "ethers";
import { formatUnits } from "ethers/lib/utils";
import useGetYearnAPY from "hooks/set/useGetYearnAPY";
import useSetTokenTVL from "hooks/set/useSetTokenTVL";
import useStakingPool from "hooks/staking/useStakingPool";
import useStakingTVL from "hooks/staking/useStakingTVL";
import Link from "next/link";
import { useRouter } from "next/router";
import React from "react";

const Products = () => {
  const router = useRouter();
  const contractAddresses = getChainRelevantContracts(ChainId.Ethereum)
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
  const { data: butterTVL } = useSetTokenTVL(contractAddresses.butter, contractAddresses.butterBatch)
  const { data: threeXTVL } = useSetTokenTVL(contractAddresses.threeX, contractAddresses.threeXBatch)

  let formatter = Intl.NumberFormat("en", {
    //@ts-ignore
    notation: "compact",
  });

  return (
    <section className="mt-10">
      <h6 className="font-medium leading-8 mb-4">Our Products</h6>
      <div className="border-t border-customLightGray">
        <div className="border-b border-customLightGray grid grid-cols-12 items-center gap-6 md:gap-8 py-7">
          <div className="col-span-12 md:col-span-4">
            <div className=" relative w-fit">
              <p className="text-black text-4xl leading-9 md:leading-10  mb-2">Sweet Vaults</p>
              <img
                src="/images/newProductBadge.svg"
                alt=""
                className="hidden md:inline-block absolute -top-16 -right-28"
              />
            </div>
            <p className=" text-primaryDark">Single-asset vaults to earn yield on your digital assets</p>
          </div>

          <div className="hidden md:block col-span-12 md:col-span-3"></div>

          <div className="col-span-4 md:col-span-1">
            <div className="flex items-center gap-2 mb-2">
              <p className="text-primaryLight leading-5">TVL </p>
              <InfoIconWithTooltip
                classExtras=""
                id="sweet-vault-tvl"
                title="Total value locked (TVL)"
                content="The amount of user funds deposited in Sweet Vaults."
              />
            </div>
            <p className="text-primary text-2xl md:text-3xl leading-8">$3.7m</p>
          </div>

          <div className="hidden md:block col-span-4 md:col-span-2"></div>

          <div className="col-span-12 md:col-span-2">
            <MainActionButton label="View" />
          </div>
        </div>

        <div className="border-b border-customLightGray grid grid-cols-12 items-center gap-6 md:gap-8 py-7">
          <div className="col-span-12 md:col-span-4 order-1">
            <div className=" relative">
              <p className="text-black text-4xl leading-9 md:leading-10  mb-2">3x</p>
              <img
                src="/images/fireProductBadge.svg"
                alt=""
                className="hidden md:inline-block absolute -top-16 left-20 object-cover"
              />
            </div>
            <p className=" text-primaryDark">
              EUR & USD exposure with noble yield that funds social impact organizations
            </p>
          </div>

          <div className="col-span-12 md:col-span-3 order-4 md:order-2">
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
              <img
                src="/images/tokens/usd-coin-usdc-logo.svg"
                alt=""
                className="h-10 w-10 rounded-full relative -left-10"
              />
            </div>
          </div>

          <div className="col-span-4 md:col-span-1 order-2 md:order-3">
            <div className="flex items-center gap-2 mb-2">
              <p className="text-primaryLight leading-5">TVL </p>
              <InfoIconWithTooltip
                classExtras=""
                id="3x-tvl"
                title="Total value locked (TVL)"
                content="The amount of user funds deposited in 3X."
              />
            </div>
            <p className="text-primary text-2xl md:text-3xl leading-8">
              {threeXTVL
                ? `$${formatter.format(
                  parseInt(
                    formatUnits(threeXTVL)
                  ),
                )}`
                : "$0"}
            </p>
          </div>

          <div className="col-span-4 md:col-span-2 order-3 md:order-4">
            <div className="flex items-center gap-2 mb-2">
              <p className="text-primaryLight leading-5">vAPR </p>
              <InfoIconWithTooltip
                classExtras=""
                id="3x-vapr"
                title="vAPR"
                content="Variable Annual Percentage Rate means that the annual percentage rate, your interest stated as a yearly rate, can change over time."
              />
            </div>
            <p className="text-primary text-2xl md:text-3xl leading-8">
              {threeXAPY && threeXStaking && threeXStaking?.apy?.gte(constants.Zero)
                ? `${(threeXAPY + bigNumberToNumber(threeXStaking.apy)).toLocaleString(undefined, localStringOptions)}%`
                : "New 🍿✨"}
            </p>
          </div>

          <div className="col-span-12 md:col-span-2 order-5">
            <Link href={`/${router?.query?.network}/set/3x`}>
              <a className="">
                <MainActionButton label="View" />
              </a>
            </Link>
          </div>
        </div>

        <div className="border-b border-customLightGray grid grid-cols-12 items-center gap-6 md:gap-8 py-7">
          <div className="col-span-12 md:col-span-4 order-1">
            <p className="text-black text-4xl leading-9 md:leading-10   mb-2">Butter</p>
            <p className=" text-primaryDark">Optimize your yield while creating positive global impact.</p>
          </div>

          <div className="col-span-12 md:col-span-3 order-4 md:order-2">
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
              <img
                src="/images/tokens/usd-coin-usdc-logo.svg"
                alt=""
                className="h-10 w-10 rounded-full relative -left-8"
              />
              <img src="/images/tokens/sLogo.svg" alt="" className="h-10 w-10 rounded-full relative -left-10" />
              <img src="/images/tokens/sDiamondLogo.svg" alt="" className="h-10 w-10 rounded-full relative -left-12" />
              <img src="/images/tokens/boltLogo.svg" alt="" className="h-10 w-10 rounded-full relative -left-14" />
              <img src="/images/tokens/clogo.svg" alt="" className="h-10 w-10 rounded-full relative -left-16" />
              <img src="/images/tokens/RAI.svg" alt="" className="h-10 w-10 rounded-full relative -left-18" />
            </div>
          </div>

          <div className="col-span-4 md:col-span-1 order-2 md:order-3">
            <div className="flex items-center gap-2 mb-2">
              <p className="text-primaryLight leading-5">TVL </p>
              <InfoIconWithTooltip
                classExtras=""
                id="butter-tvl"
                title="Total value locked (TVL)"
                content="The amount of user funds deposited in Butter."
              />
            </div>
            <p className="text-primary text-2xl md:text-3xl leading-8">
              {butterTVL
                ? `$${formatter.format(
                  parseInt(
                    formatUnits(butterTVL)
                  ),
                )}`
                : "$0"}
            </p>
          </div>

          <div className="col-span-4 md:col-span-2 order-3 md:order-4">
            <div className="flex items-center gap-2 mb-2">
              <p className="text-primaryLight leading-5">vAPR </p>
              <InfoIconWithTooltip
                classExtras=""
                id="butter-vapr"
                title="vAPR"
                content="Variable Annual Percentage Rate means that the annual percentage rate, your interest stated as a yearly rate, can change over time."
              />
            </div>
            <p className="text-primary text-2xl md:text-3xl leading-8">
              {butterAPY && butterStaking && butterStaking?.apy?.gte(constants.Zero)
                ? `${(butterAPY + bigNumberToNumber(butterStaking.apy)).toLocaleString(undefined, localStringOptions)}%`
                : "New 🍿✨"}
            </p>
          </div>

          <div className="col-span-12 md:col-span-2 order-5">
            <Link href={`/${router?.query?.network}/set/butter`}>
              <a className="">
                <MainActionButton label="View" />
              </a>
            </Link>
          </div>
        </div>

        <div className="border-b border-customLightGray grid grid-cols-12 items-center gap-6 md:gap-8 py-7">
          <div className="col-span-12 md:col-span-4">
            <p className="text-black text-4xl leading-9 md:leading-10  mb-2">Staking</p>
            <p className=" text-primaryDark">Single-asset vaults to earn yield on your digital assets</p>
          </div>

          <div className="hidden md:block col-span-12 md:col-span-3"></div>

          <div className="col-span-4 md:col-span-1">
            <div className="flex items-center gap-2 mb-2">
              <p className="text-primaryLight leading-5">TVL </p>
              <InfoIconWithTooltip
                classExtras=""
                id="staking-tvl"
                title="Total value locked (TVL)"
                content="The amount of user funds deposited in Staking contracts."
              />
            </div>
            <p className="text-primary text-2xl md:text-3xl leading-8">{mainnetStakingTVL && polygonStakingTVL
              ? `$${formatter.format(
                parseInt(
                  formatUnits(mainnetStakingTVL.add(polygonStakingTVL)))
              )}`
              : "$0"}</p>
          </div>

          <div className="hidden md:block col-span-12 md:col-span-2"></div>

          <div className="col-span-12 md:col-span-2">
            <Link href="/staking">
              <a className="">
                <MainActionButton label="View" />
              </a>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Products;