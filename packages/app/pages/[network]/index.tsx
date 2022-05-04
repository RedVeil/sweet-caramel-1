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
    <div className="h-full">
      <NavBar />
      <div className="flex mx-auto justify-center h-full md:py-20 flex-col md:flex-row w-11/12 lglaptop:w-9/12 2xl:max-w-7xl">
        <Hero
          header="Butter"
          content="Optimize your yield while creating positive global impact."
          image="/images/rocket.svg"
          link="/butter"
        />
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
