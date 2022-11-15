import fs from "fs";
import path from "path";

export const cache = {
  default: function () {
    return { lastBlock: 0, holders: [] };
  },
  path: function (chainId) {
    return path.resolve(__dirname, `holders', ${chainId}-holders.json`);
  },
  exists: function (chainId) {
    return fs.existsSync(this.path(chainId));
  },
  get: function (chainId) {
    return this.exists(chainId) ? JSON.parse(fs.readFileSync(this.path(chainId), "utf8")) : this.default();
  },
  write: function (holders, chainId, endBlock) {
    fs.writeFile(this.path(chainId), JSON.stringify({ lastBlock: endBlock, holders }), () => {});
  },
};
export default cache;
