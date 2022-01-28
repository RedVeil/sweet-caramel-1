import { parseEther } from "ethers/lib/utils";
import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { encodeCallScript } from "../../utils/aragon/callscript";
import { getNamedAccountsByChainId } from "../../utils/getNamedAccounts";

interface Args {}

export default task("aragon:create-vote", "creates an aragon vote").setAction(
  async (args: Args, hre: HardhatRuntimeEnvironment) => {
    const { pop, voting, daoAgent, tokenManager, rewardsDistribution } =
      getNamedAccountsByChainId(1);
    const [signer] = await hre.ethers.getSigners();

    const popContract = await hre.ethers.getContractAt(
      "@openzeppelin/contracts/token/ERC20/ERC20.sol:ERC20",
      pop
    );

    const votingContract = new hre.ethers.Contract(
      voting,
      require("../../external/aragon/Voting.json"),
      signer
    );

    const agent = new hre.ethers.Contract(
      daoAgent,
      require("../../external/aragon/Agent.json")
    );

    const tokens = new hre.ethers.Contract(
      tokenManager,
      require("../../external/aragon/TokenManager.json"),
      signer
    );

    const evmScript = encodeCallScript([
      {
        to: daoAgent,
        data: agent.interface.encodeFunctionData(
          "execute(address,uint256,bytes)",
          [
            pop,
            0,
            popContract.interface.encodeFunctionData("transfer", [
              rewardsDistribution,
              parseEther("1224000"),
            ]),
          ]
        ),
      },
    ]);

    const voteEvmScript = encodeCallScript([
      {
        to: voting,
        data: votingContract.interface.encodeFunctionData(
          "newVote(bytes,string)",
          [evmScript, ""]
        ),
      },
    ]);

    console.log("forwarding vote ...");
    const tx = await tokens.forward(voteEvmScript);
    const receipt = await tx.wait();
    console.log({ receipt });
  }
);
