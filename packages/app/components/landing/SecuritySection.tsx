import MobileCardSlider from "components/Common/MobileCardSlider";
import Link from "next/link";
import React from "react";

const descriptions = {
  zokyo: (
    <>
      {" "}
      Zokyo is an end-to-end security resource that provides distinguishable security auditing and penetration testing
      services alongside prominent vulnerability assessments.{" "}
      <Link href="https://assets.website-files.com/5f99eb79d508ca853be5f2e8/61b21474b7a1746d889f599d_Popcorn%20SC%20Audit.pdf">
        <a className="text-customPurple">See Zokyo's review.</a>
      </Link>
    </>
  ),
  immunefi: (
    <>
      Immunefi is a leading bug bounty platform for Web3 where hundreds of security researchers review smart contracts
      for vulnerabilites.{" "}
      <Link href="https://immunefi.com/bounty/popcornnetwork/">
        <a className="text-customPurple">See Popcorn's bug bounty program.</a>
      </Link>
    </>
  ),
  g0: (
    <>
      {" "}
      g0 group is an industry leading security reviewer having audited blockchain projects such as Gnosis Safe and Nexus
      Mutual.{" "}
      <Link href="/docs/PopcornMay2022.pdf">
        <a className="text-customPurple">See g0's review.</a>
      </Link>
    </>
  ),
};
const SecuritySection = () => {
  return (
    <section className="grid grid-cols-12 md:gap-14 pt-10">
      <div className="col-span-12 md:col-span-3 hidden md:block">
        <div>
          <h1 className="text-6xl leading-12 pt-10">Security</h1>
          <p className="mt-4 text-primaryDark">Core smart contracts have been audited by the best in the business.</p>
        </div>
      </div>
      <div className="col-span-12 md:col-span-9 hidden md:grid grid-cols-3 gap-8 laptop:gap-14 mt-9">
        <div className="col-span-3 md:col-span-1">
          <a href="https://www.zokyo.io/audit-reports?2ebcbc23_page=3" target="_blank">
            <img src="/images/zokyoCard.svg" alt="Zokyo logo" className="w-full object-contain" />
          </a>
          <p className="text-black text-3xl leading-9 mt-6 mb-4">Zokyo</p>
          <p className="text-primaryDark leading-5">{descriptions.zokyo}</p>
        </div>

        <div className="col-span-3 md:col-span-1">
          <a href="https://github.com/g0-group/Audits" target="_blank">
            <img src="/images/g0Card.svg" alt="g0 logo" className="w-full object-contain" />
          </a>
          <p className="text-black text-3xl leading-9 mt-6 mb-4">g0</p>
          <p className="text-primaryDark leading-5">{descriptions.g0}</p>
        </div>
        <div className="col-span-3 md:col-span-1">
          <a href="https://immunefi.com/bounty/popcornnetwork/" target="_blank">
            <img src="/images/immunefiCard.svg" alt="Immunefi logo" className="w-full object-contain" />
          </a>
          <p className="text-black text-3xl leading-9 mt-6 mb-4">Immunefi</p>
          <p className="text-primaryDark leading-5">{descriptions.immunefi}</p>
        </div>
      </div>
      <div className="col-span-12 md:hidden mt-9">
        <MobileCardSlider>
          <div className="px-2">
            <a href="https://www.zokyo.io/audit-reports?2ebcbc23_page=3" target="_blank">
              <div className=" bg-customRed rounded-lg p-14 h-80 w-full md:w-80 flex justify-center items-center relative">
                <div className="absolute bg-black bg-opacity-60 rounded top-4 left-4">
                  <p className="text-customRed px-4 leading-8 py-0.5 font-medium">Audited by</p>
                </div>
                <img src="/images/zokyo.svg" alt="" className="rounded-lg" />
              </div>
            </a>
            <p className="text-black text-3xl leading-9 mt-6 mb-4">Zokyo</p>
            <p className="text-primaryDark leading-5">{descriptions.zokyo}</p>
          </div>

          <div className="px-2">
            <a href="https://github.com/g0-group/Audits" target="_blank">
              <div className=" bg-customPurple rounded-lg p-14 h-80 w-full md:w-80 flex justify-center items-center relative">
                <div className="absolute bg-black bg-opacity-60 rounded top-4 left-4">
                  <p className="text-customPurple px-4 leading-8 py-0.5 font-medium">Audited by</p>
                </div>
                <img src="/images/g0.svg" alt="" className="rounded-lg" />
              </div>
            </a>
            <p className="text-black text-3xl leading-9 mt-6 mb-4">g0</p>
            <p className="text-primaryDark leading-5">{descriptions.g0}</p>
          </div>

          <div className="px-2">
            <a href="https://immunefi.com/bounty/popcornnetwork/" target="_blank">
              <div className=" bg-customGreen rounded-lg p-14 h-80 w-full md:w-80 flex justify-center items-center relative">
                <div className="absolute bg-black bg-opacity-60 rounded top-4 left-4">
                  <p className="text-customGreen px-4 leading-8 py-0.5 font-medium">Audited by</p>
                </div>
                <img src="/images/immunefi.svg" alt="" className="rounded-lg" />
              </div>
            </a>
            <p className="text-black text-3xl leading-9 mt-6 mb-4">Immunefi</p>
            <p className="text-primaryDark leading-5">{descriptions.immunefi}</p>
          </div>
        </MobileCardSlider>
      </div>
    </section>
  );
};

export default SecuritySection;
