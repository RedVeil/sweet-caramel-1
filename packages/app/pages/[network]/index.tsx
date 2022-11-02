import Hero from "@popcorn/app/components/landing/Hero";
import Products from "@popcorn/app/components/landing/Products";
import SecuritySection from "@popcorn/app/components/landing/SecuritySection";
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
    <main>
      <Hero />
      <Products />
      <SecuritySection />
    </main>
  );
};

// export async function getServerSideProps({ req, res }) {
//   res.setHeader("Cache-Control", "s-maxage=14400");
//   const contractAddressesEth = getChainRelevantContracts(ChainId.Ethereum);
//   const contractAddressesPoly = getChainRelevantContracts(ChainId.Polygon);
//   const mainnetStakingTVL = await getStakingTVL(
//     "ethStaking",
//     contractAddressesEth.popStaking,
//     PRC_PROVIDERS[ChainId.Ethereum],
//   );
//   const polygonStakingTVL = await getStakingTVL(
//     "polygonStaking",
//     contractAddressesPoly.popStaking,
//     PRC_PROVIDERS[ChainId.Polygon],
//   );
//   const butterTVL = await getSetTokenTVL(
//     "butterTVL",
//     contractAddressesEth.butter,
//     contractAddressesEth.butterBatch,
//     PRC_PROVIDERS[ChainId.Ethereum],
//   );
//   const threeXTVL = await getSetTokenTVL(
//     "threeXTVL",
//     contractAddressesEth.threeX,
//     contractAddressesEth.threeXBatch,
//     PRC_PROVIDERS[ChainId.Ethereum],
//   );

//   const tvl =
//     Number(formatUnits(mainnetStakingTVL)) +
//     Number(formatUnits(polygonStakingTVL)) +
//     Number(formatUnits(butterTVL)) +
//     Number(formatUnits(threeXTVL));
//   return { props: { tvl } };
// }

export default IndexPage;
