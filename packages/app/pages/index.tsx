import Hero from "components/landing/Hero";
import NavBar from "components/NavBar/NavBar";
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
    <div>
      <NavBar />
      <div className="flex mx-auto justify-center md:py-20 flex-col md:flex-row w-11/12 lglaptop:w-9/12 2xl:max-w-7xl">
        <Hero
          header="Butter"
          content="Our Yield Optimizer. Deposit stablecoins and earn by leveraging the power of compound interest."
          image="images/rocket.svg"
          link="/butter"
        />
        <Hero header="Farming" content="Stake your token to earn more POP." image="images/farmer.svg" link="/staking" />
      </div>
    </div>
  );
};

export default IndexPage;
