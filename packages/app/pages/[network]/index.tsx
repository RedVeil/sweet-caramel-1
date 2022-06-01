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
    <div className="flex flex-col md:flex-row">
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
  );
};

export default IndexPage;
