import { InfoIconWithTooltip } from "components/InfoIconWithTooltip";
import MainActionButton from "components/MainActionButton";
import React from "react";

const Products = () => {
  return (
    <section className="mt-10">
      <h6 className="font-medium leading-8 mb-4">Our Products</h6>
      <div className="border-t border-dropdownBorder">
        <div className="border-b border-dropdownBorder grid grid-cols-12 items-center gap-6 md:gap-8 py-7">
          <div className="col-span-12 md:col-span-4">
            <div className=" relative w-fit">
              <p className="text-black text-4xl leading-8 mb-1">Sweet Vaults</p>
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
                id="3"
                title="Batch Processing"
                content="Mint and redeem requests are processed manually approximately every 48 hours or when a batch reaches 100k"
              />
            </div>
            <p className="text-primary text-2xl md:text-3xl leading-8">$3.7m</p>
          </div>

          <div className="hidden md:block col-span-4 md:col-span-2"></div>

          <div className="col-span-12 md:col-span-2">
            <MainActionButton label="View" />
          </div>
        </div>

        <div className="border-b border-dropdownBorder grid grid-cols-12 items-center gap-6 md:gap-8 py-7">
          <div className="col-span-12 md:col-span-4 order-1">
            <div className=" relative">
              <p className="text-black text-4xl leading-8 mb-1">3x</p>
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
                id="3"
                title="Batch Processing"
                content="Mint and redeem requests are processed manually approximately every 48 hours or when a batch reaches 100k"
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
                id="3"
                title="Batch Processing"
                content="Mint and redeem requests are processed manually approximately every 48 hours or when a batch reaches 100k"
              />
            </div>
            <p className="text-primary text-2xl md:text-3xl leading-8">$3.7m</p>
          </div>

          <div className="col-span-4 md:col-span-2 order-3 md:order-4">
            <div className="flex items-center gap-2 mb-2">
              <p className="text-primaryLight leading-5">vAPR </p>
              <InfoIconWithTooltip
                classExtras=""
                id="3"
                title="Batch Processing"
                content="Mint and redeem requests are processed manually approximately every 48 hours or when a batch reaches 100k"
              />
            </div>
            <p className="text-primary text-2xl md:text-3xl leading-8">255.93%</p>
          </div>

          <div className="col-span-12 md:col-span-2 order-5">
            <MainActionButton label="View" />
          </div>
        </div>

        <div className="border-b border-dropdownBorder grid grid-cols-12 items-center gap-6 md:gap-8 py-7">
          <div className="col-span-12 md:col-span-4 order-1">
            <p className="text-black text-4xl leading-8 mb-1">Butter</p>
            <p className=" text-primaryDark">Optimize your yield while creating positive global impact.</p>
          </div>

          <div className="col-span-12 md:col-span-3 order-4 md:order-2">
            <div className="flex gap-2">
              <p className="text-primaryLight">Exposure</p>
              <InfoIconWithTooltip
                classExtras=""
                id="3"
                title="Batch Processing"
                content="Mint and redeem requests are processed manually approximately every 48 hours or when a batch reaches 100k"
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
                id="3"
                title="Batch Processing"
                content="Mint and redeem requests are processed manually approximately every 48 hours or when a batch reaches 100k"
              />
            </div>
            <p className="text-primary text-2xl md:text-3xl leading-8">$3.7m</p>
          </div>

          <div className="col-span-4 md:col-span-2 order-3 md:order-4">
            <div className="flex items-center gap-2 mb-2">
              <p className="text-primaryLight leading-5">vAPR </p>
              <InfoIconWithTooltip
                classExtras=""
                id="3"
                title="Batch Processing"
                content="Mint and redeem requests are processed manually approximately every 48 hours or when a batch reaches 100k"
              />
            </div>
            <p className="text-primary text-2xl md:text-3xl leading-8">255.93%</p>
          </div>

          <div className="col-span-12 md:col-span-2 order-5">
            <MainActionButton label="View" />
          </div>
        </div>

        <div className="border-b border-dropdownBorder grid grid-cols-12 items-center gap-6 md:gap-8 py-7">
          <div className="col-span-12 md:col-span-4">
            <p className="text-black text-4xl leading-8 mb-1">Staking</p>
            <p className=" text-primaryDark">Single-asset vaults to earn yield on your digital assets</p>
          </div>

          <div className="hidden md:block col-span-12 md:col-span-3"></div>

          <div className="col-span-4 md:col-span-1">
            <div className="flex items-center gap-2 mb-2">
              <p className="text-primaryLight leading-5">TVL </p>
              <InfoIconWithTooltip
                classExtras=""
                id="3"
                title="Batch Processing"
                content="Mint and redeem requests are processed manually approximately every 48 hours or when a batch reaches 100k"
              />
            </div>
            <p className="text-primary text-2xl md:text-3xl leading-8">$3.7m</p>
          </div>

          <div className="hidden md:block col-span-12 md:col-span-2"></div>

          <div className="col-span-12 md:col-span-2">
            <MainActionButton label="View" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Products;
