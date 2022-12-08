import { NextApiRequest, NextApiResponse } from "next";
import cs from "@popcorn/utils/circulating-supply/holders/circulating-supply.json";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200);
  return res.send(cs.circulatingSupply);
}
