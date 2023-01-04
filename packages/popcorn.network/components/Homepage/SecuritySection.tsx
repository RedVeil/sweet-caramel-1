import React from "react";

const SecuritySection = () => {
  return (
    <section className="grid grid-cols-12 lg:gap-14  smmd:px-6 lg:px-8">
      <div className="col-span-12 lg:col-span-3 pt-10 hidden smmd:block">
        <div>
          <h1 className="text-4xl leading-12 pt-10">Security</h1>
          <p className="mt-4 text-primaryDark">
            Smart contracts are inherently risky and may contain bugs or vulnerabilities. Users should exercise caution
            when interacting with smart contracts and use at their own risk.
          </p>
        </div>
      </div>

      <div className="col-span-12 smmd:hidden mt-9">
        <div className="px-6">
          <div>
            <h1 className="text-3xl leading-12 pt-10">Security</h1>
            <p className="mt-4 text-primaryDark">
              Smart contracts are inherently risky and may contain bugs or vulnerabilities. Users should exercise
              caution when interacting with smart contracts and use at their own risk.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
export default SecuritySection;
