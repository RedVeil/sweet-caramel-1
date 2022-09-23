import { parseEther, parseUnits } from "@ethersproject/units";
import { useContractMetadata } from "@popcorn/app/contractMetadataOverride";
import { ERC20__factory, Vault } from "@popcorn/hardhat/typechain";
import getToken from "./getToken";
import { Address, SweetVaultMetadata } from "./types";
import { SweetVaultWithMetadata } from "./types/index";

function getBestVault(yVaultData, underlyingTokenAddress) {
  const possibleVaults = yVaultData.filter(
    (vault) => vault?.token?.address.toLowerCase() === underlyingTokenAddress.toLowerCase(),
  )
  if (possibleVaults.length === 1) {
    return possibleVaults[0];
  } else {
    return possibleVaults.sort((a, b) => a.inception - b.inception)[possibleVaults.length - 1]
  }
}

function getVaultName(vault): string {
  const splitName = vault.display_name.split(" ")
  if (splitName.length > 1) {
    return splitName[1]
  } else {
    return splitName[0]
  }
}

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
  const vault = getBestVault(yVaultData, underlyingTokenAddress);
  const staking = ERC20__factory.connect(await sweetVault.staking(), signerOrProvider);
  const decimals = await sweetVault.decimals();

  const { metadata } = useContractMetadata({
    chainId: chainId,
    address: sweetVault.address,
    metadata: {
      name: getVaultName(vault),
      symbol: vault.token.symbol,
      balance: account ? await staking.balanceOf(account) : parseEther("0"),
      allowance: account ? await sweetVault.allowance(account, sweetVault.address) : parseEther("0"),
      decimals: decimals,
      icon: vault.icon,
      pricePerShare: pricePerShare,
      tvl: pricePerShare
        .mul(totalSupply)
        .div(parseUnits("1", decimals))
        .mul(parseEther(vault.tvl.price.toString()))
        .div(parseUnits("1", decimals)),
      apy: vault?.apy?.net_apy * 100 * (98.5 / 100),
      underlyingToken: await getToken(
        ERC20__factory.connect(underlyingTokenAddress, signerOrProvider),
        signerOrProvider,
        chainId,
        account,
        sweetVault.address,
      ),
      deposited: account ? (await staking.balanceOf(account)).mul(pricePerShare).div(parseUnits("1", decimals)) : parseEther("0"),
      stakingAdress: staking.address,
    } as SweetVaultMetadata,
  });

  return {
    contract: sweetVault,
    metadata,
  };
}
