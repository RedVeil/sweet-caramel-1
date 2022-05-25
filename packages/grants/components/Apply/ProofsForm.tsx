import React from "react";

const ProofsForm = () => {
  return (
    <div className=" rounded-6xl p-10 mt-20 shadow-custom-lg">
      <h6 className=" font-semibold text-3xl text-center mb-12">Proof of Ownership</h6>

      <form className="mt-20">
        <div>
          <label htmlFor="ownership-url" className="block text-lg font-semibold text-gray-900">
            Please share proof of ownership
          </label>
          <p className=" text-gray-500">
            Share a URL on the beneficiary’s website or a tweet on the beneficiary’s official Twitter account that
            contains the Ethereum address shared in Step 2
          </p>
          <div className="mt-1">
            <input
              type="text"
              name="ownership-url"
              id="ownership-url"
              className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md py-3"
            />
          </div>
          <p className="mt-2 text-sm text-gray-500">* The official company name of your non profit organization</p>
        </div>
      </form>
    </div>
  );
};

export default ProofsForm;
