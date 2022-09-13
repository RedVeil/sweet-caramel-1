import { getChainRelevantContracts } from "@popcorn/hardhat/lib/utils/getContractAddresses";
import { ChainId, PRC_PROVIDERS } from "@popcorn/utils";
import Hero from "components/landing/Hero";
import Products from "components/landing/Products";
import SecuritySection from "components/landing/SecuritySection";
import { formatUnits } from "ethers/lib/utils";
import { getSetTokenTVL } from "hooks/set/useSetTokenTVL";
import { getStakingTVL } from "hooks/staking/useStakingTVL";
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
  res.setHeader("Cache-Control", "s-maxage=14400");
  console.log("PRELOAD TVL")
  const start = new Date();
  console.log(start)
  const contractAddressesEth = getChainRelevantContracts(ChainId.Ethereum);
  const contractAddressesPoly = getChainRelevantContracts(ChainId.Polygon);
  const mainnetStakingTVL = await getStakingTVL(
    "ethStaking",
    contractAddressesEth.popStaking,
    PRC_PROVIDERS[ChainId.Ethereum],
  );
  const polygonStakingTVL = await getStakingTVL(
    "polygonStaking",
    contractAddressesPoly.popStaking,
    PRC_PROVIDERS[ChainId.Polygon],
  );
  const butterTVL = await getSetTokenTVL(
    "butterTVL",
    contractAddressesEth.butter,
    contractAddressesEth.butterBatch,
    PRC_PROVIDERS[ChainId.Ethereum],
  );
  const threeXTVL = await getSetTokenTVL(
    "threeXTVL",
    contractAddressesEth.threeX,
    contractAddressesEth.threeXBatch,
    PRC_PROVIDERS[ChainId.Ethereum],
  );
  const end = new Date()
  console.log(end)
  const diff = end.getTime() - start.getTime()
  console.log("DIFF", diff)
  return { props: { tvl: mainnetStakingTVL.add(polygonStakingTVL).add(butterTVL).add(threeXTVL) } };
}

export default IndexPage;
