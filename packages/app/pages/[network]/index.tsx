import Hero from "components/landing/Hero";
import { useRouter } from "next/router";
import React, { useEffect } from "react";

const IndexPage = () => {
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.pathname !== "/") {
      router.replace(window.location.pathname);
    }
  }, [router.pathname]);

  return (
    <div className="grid grid-cols-12 gap-y-8 md:gap-8 pb-14">
      <div className="col-span-12 md:col-span-6 flex flex-col gap-y-8 order-2 md:order-1">
        <div className="h-54">
          <Hero
            header="3x"
            content="EUR and USD exposure with noble yield that funds social impact organizations."
            image="/images/3xHero.svg"
            link="/set/3x"
            imageSize="h-20"
          />
        </div>
        <div className="h-54">
          <Hero
            header="Butter"
            content="Optimize your stablecoin yield while creating positive global impact."
            image="/images/butterHero.svg"
            link="/set/butter"
            imageSize="h-20"
          />
        </div>
      </div>
      <div className="col-span-12 md:col-span-6 h-full order-1 md:order-2">
        <Hero
          header="Staking"
          content="Stake your tokens to participate and earn."
          image="/images/farmer.svg"
          link="/staking"
        />
      </div>
    </div>
  );
};

export default IndexPage;
