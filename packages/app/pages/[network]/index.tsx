import Hero from "components/landing/Hero";
import Products from "components/landing/Products";
import SecuritySection from "components/landing/SecuritySection";
import { useRouter } from "next/router";
import React, { useEffect } from "react";

const IndexPage = ({ tvl }) => {
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.pathname !== "/") {
      router.replace(window.location.pathname);
    }
  }, [router.pathname]);
  return (
    <main>
      <Hero tvl={tvl} />
      <Products />
      <SecuritySection />
    </main>
  );
};

export async function getServerSideProps({ req, res }) {
  const tvlRes = await fetch('/api/getTvl')
  const tvlJson = await tvlRes.json()

  res.setHeader("Cache-Control", "s-maxage=14400");
  return { props: { tvl: tvlJson.tvl } };
}

export default IndexPage;
