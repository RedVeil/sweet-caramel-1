import MainActionButton from "components/MainActionButton";
import React from "react";

const Products = () => {
  return (
    <section>
      <h6 className="font-medium leading-8">Our Products</h6>
      <div className="border-t border-gray-300">
        <div className="border-b border-gray-300 grid grid-cols-12 py-7">
          <div className="col-span-12 md:col-span-5">
            <p className="text-gray-900 text-4xl leading-8 mb-1">Sweet Vaults</p>
            <p className=" text-customDarkGray">Single-asset vaults to earn yield on your digital assets</p>
          </div>

          <div className="col-span-12 md:col-span-3"></div>

          <div className="col-span-12 md:col-span-1">
            <div className="flex items-center gap-2 mb-2">
              <p className="text-gray-800 leading-5">TVL </p>
              <img
                src="/images/icons/tooltip.svg"
                className={`inline-flex items-center border border-transparent rounded-full text-gray-500 `}
              />
            </div>
            <p className="text-gray-900 text-4xl leading-8">3.7m</p>
          </div>

          <div className="col-span-12 md:col-span-2"></div>

          <div className="col-span-12 md:col-span-1">
            <MainActionButton label="View" />
          </div>
        </div>

        <div className="border-b border-gray-300 grid grid-cols-12 py-7">
          <div className="col-span-12 md:col-span-5">
            <p className="text-gray-900 text-4xl leading-8 mb-1">3x</p>
            <p className=" text-customDarkGray">
              EUR & USD exposure with noble yield that funds social impact organizations
            </p>
          </div>

          <div className="col-span-12 md:col-span-3"></div>

          <div className="col-span-12 md:col-span-1">
            <div className="flex items-center gap-2 mb-2">
              <p className="text-gray-800 leading-5">TVL </p>
              <img
                src="/images/icons/tooltip.svg"
                className={`inline-flex items-center border border-transparent rounded-full text-gray-500 `}
              />
            </div>
            <p className="text-gray-900 text-4xl leading-8">3.7m</p>
          </div>

          <div className="col-span-12 md:col-span-2">
            <div className="flex items-center gap-2 mb-2">
              <p className="text-gray-800 leading-5">vAPR </p>
              <img
                src="/images/icons/tooltip.svg"
                className={`inline-flex items-center border border-transparent rounded-full text-gray-500 `}
              />
            </div>
            <p className="text-gray-900 text-4xl leading-8">255.93%</p>
          </div>

          <div className="col-span-12 md:col-span-1">
            <MainActionButton label="View" />
          </div>
        </div>

        <div className="border-b border-gray-300 grid grid-cols-12 py-7">
          <div className="col-span-12 md:col-span-5">
            <p className="text-gray-900 text-4xl leading-8 mb-1">Butter</p>
            <p className=" text-customDarkGray">Optimize your yield while creating positive global impact.</p>
          </div>

          <div className="col-span-12 md:col-span-3"></div>

          <div className="col-span-12 md:col-span-1">
            <div className="flex items-center gap-2 mb-2">
              <p className="text-gray-800 leading-5">TVL </p>
              <img
                src="/images/icons/tooltip.svg"
                className={`inline-flex items-center border border-transparent rounded-full text-gray-500 `}
              />
            </div>
            <p className="text-gray-900 text-4xl leading-8">3.7m</p>
          </div>

          <div className="col-span-12 md:col-span-2">
            <div className="flex items-center gap-2 mb-2">
              <p className="text-gray-800 leading-5">vAPR </p>
              <img
                src="/images/icons/tooltip.svg"
                className={`inline-flex items-center border border-transparent rounded-full text-gray-500 `}
              />
            </div>
            <p className="text-gray-900 text-4xl leading-8">255.93%</p>
          </div>

          <div className="col-span-12 md:col-span-1">
            <MainActionButton label="View" />
          </div>
        </div>

        <div className="border-b border-gray-300 grid grid-cols-12 py-7">
          <div className="col-span-12 md:col-span-5">
            <p className="text-gray-900 text-4xl leading-8 mb-1">Staking</p>
            <p className=" text-customDarkGray">Single-asset vaults to earn yield on your digital assets</p>
          </div>

          <div className="col-span-12 md:col-span-3"></div>

          <div className="col-span-12 md:col-span-1">
            <div className="flex items-center gap-2 mb-2">
              <p className="text-gray-800 leading-5">TVL </p>
              <img
                src="/images/icons/tooltip.svg"
                className={`inline-flex items-center border border-transparent rounded-full text-gray-500 `}
              />
            </div>
            <p className="text-gray-900 text-4xl leading-8">3.7m</p>
          </div>

          <div className="col-span-12 md:col-span-2"></div>

          <div className="col-span-12 md:col-span-1">
            <MainActionButton label="View" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Products;
