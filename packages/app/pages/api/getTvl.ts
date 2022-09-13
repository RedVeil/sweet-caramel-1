import { NextApiRequest, NextApiResponse } from "next";
import { getChainRelevantContracts } from "@popcorn/hardhat/lib/utils/getContractAddresses";
import { ChainId, PRC_PROVIDERS } from "@popcorn/utils";
import { getSetTokenTVL } from "hooks/set/useSetTokenTVL";
import { getStakingTVL } from "hooks/staking/useStakingTVL";
import { BigNumber } from "ethers";

export default async function getTvl(req: NextApiRequest, res: NextApiResponse) {
  let tvl: BigNumber
  try {
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
    tvl = mainnetStakingTVL.add(polygonStakingTVL).add(butterTVL).add(threeXTVL)
  } catch (err) {
    return res.status(400).send({ error: err });
  }

  res.setHeader("Cache-Control", "s-maxage=14400");
  return res.json({ success: true, tvl });

}