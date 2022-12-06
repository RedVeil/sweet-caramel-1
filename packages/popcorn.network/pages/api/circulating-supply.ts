import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const data = await fetch(
    "https://raw.githubusercontent.com/popcorndao/sweet-caramel/circulating-supply/packages/utils/src/circulating-supply/holders/circulating-supply.json",
  );
  res.status(200);
  return res.send((await data.json()).circulatingSupply);
}
