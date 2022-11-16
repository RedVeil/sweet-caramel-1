import fs from "fs";
import path from "path";

const writeQueue = [];
export const cache = {
  default: function () {
    return { lastBlock: 0, holders: [] };
  },
  path: function (chainId) {
    return path.resolve(__dirname, "holders", `${chainId}-holders.json`);
  },
  exists: function (chainId) {
    return fs.existsSync(this.path(chainId));
  },
  get: function (chainId) {
    return this.exists(chainId) ? JSON.parse(fs.readFileSync(this.path(chainId), "utf8")) : this.default();
  },
  write: function (holders, chainId, endBlock) {
    writeQueue.push(() =>
      fs.writeFile(this.path(chainId), JSON.stringify({ lastBlock: endBlock, holders }), () => {
        if (writeQueue.length) {
          writeQueue.pop()();
        }
      }),
    );
    const tId = setTimeout(() => {
      if (writeQueue.length) {
        writeQueue.pop()();
      }
      clearTimeout(tId);
    }, 1000);
  },
};
export default cache;
