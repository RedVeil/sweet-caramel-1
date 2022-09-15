import { parseEther } from "@ethersproject/units";
import { useContractMetadata } from "@popcorn/app/contractMetadataOverride";
import { ERC20__factory, Vault } from "@popcorn/hardhat/typechain";
import getToken from "./getToken";
import { Address, SweetVaultMetadata } from "./types";
import { SweetVaultWithMetadata } from "./types/index";

export default async function getSweetVault(
  account: Address | null,
  sweetVault: Vault,
  chainId: number,
  signerOrProvider,
): Promise<SweetVaultWithMetadata> {
  const pricePerShare = await sweetVault.pricePerShare();
  const totalSupply = await sweetVault.totalSupply();
  const yVaultData = await fetch("https://api.yearn.finance/v1/chains/1/vaults/all")
    .then((res) => res.json())
    .catch((ex) => {
      console.log("Error while fetching yearn vaults", ex.toString());
    });
  const underlyingTokenAddress = await sweetVault.token();
  const vault = yVaultData.find(
    (vault) => vault?.token?.address.toLowerCase() === underlyingTokenAddress.toLowerCase(),
  );

  const staking = ERC20__factory.connect(await sweetVault.staking(), signerOrProvider);

  const { metadata } = useContractMetadata({
    chainId: chainId,
    address: sweetVault.address,
    metadata: {
      name: vault.display_name.split(" ")[1],
      symbol: vault.token.symbol,
      balance: account ? await staking.balanceOf(account) : parseEther("0"),
      allowance: account ? await sweetVault.allowance(account, sweetVault.address) : parseEther("0"),
      decimals: await sweetVault.decimals(),
      icon: vault.icon,
      pricePerShare: pricePerShare,
      tvl: pricePerShare
        .mul(totalSupply)
        .div(parseEther("1"))
        .mul(parseEther(vault.tvl.price.toString()))
        .div(parseEther("1")),
      apy: (vault?.apy?.net_apy / 2) * 100 * (98.5 / 100),
      underlyingToken: await getToken(
        ERC20__factory.connect(underlyingTokenAddress, signerOrProvider),
        signerOrProvider,
        chainId,
        account,
        sweetVault.address,
      ),
      deposited: account ? (await staking.balanceOf(account)).mul(pricePerShare).div(parseEther("1")) : parseEther("0"),
      stakingAdress: staking.address,
    } as SweetVaultMetadata,
  });

  return {
    contract: sweetVault,
    metadata,
  };
}
