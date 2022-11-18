import { Dialog, Transition } from '@headlessui/react';
import FacebookPixel from 'components/FacebookPixel';
import LinkedInPagePixel from 'components/LinkedInPagePixel';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { Fragment, useEffect, useState, useRef, useCallback } from 'react';
import { useOnClickOutside } from '../hooks';
import YieldSection from 'components/Homepage/YieldSection';
import Hero from 'components/Homepage/Hero';
import AsSeenSection from 'components/Homepage/AsSeenSection';
import SecuritySection from 'components/Homepage/SecuritySection';
import PartnersSection from 'components/Homepage/PartnersSection';
import Header from 'components/Header';
import { getSetTokenTVL } from 'hooks/tvl/useSetTokenTVL';
import { ChainId, PRC_PROVIDERS } from 'web3/connectors';
import { formatUnits } from 'ethers/lib/utils';
import { getStakingTVL } from 'hooks/tvl/useStakingTVL';
import { getPoolSize } from 'hooks/tvl/usePoolSize';
import GoogleAnalyticsPrompt from 'components/CommonComponents/GoogleAnalyticsPrompt';

const IndexPage = ({tvlProps}) => {
	const router = useRouter();

	const [open, setOpen] = useState(false);

	useEffect(() => {
		if (typeof window !== 'undefined' && window.location.pathname !== '/') {
			router.replace(window.location.pathname);
		}
	}, [router.pathname]);



	return (
		<div className="font-landing">
			<FacebookPixel />
			<LinkedInPagePixel />
		<main>
			<section className="grid grid-cols-12 lg:gap-14 lg:px-8 mt-8 lg:mt-4">
				<div className="col-span-12 lg:hidden px-6 lg:px-0">
					<Header open={open} setOpen={setOpen}/>
				<Hero/>
				</div>
				<div className="col-span-12 lg:col-span-3 px-6 lg:px-0">
				<div className="lg:sticky lg:top-10">
				<YieldSection tvlProps={tvlProps}/>
              </div>
				</div>
				<div className="col-span-12 lg:col-span-9" >
				<div className="hidden lg:block">
				<Header open={open} setOpen={setOpen}/>
				<Hero/>
				</div>
					<AsSeenSection/>
				</div>
			</section>
			<SecuritySection/>
			<PartnersSection/>
			<GoogleAnalyticsPrompt/>
			</main>
		</div>
	);
};

export default IndexPage;

export async function getServerSideProps({ req, res }) {
	res.setHeader('Cache-Control', 's-maxage=14400');
	let formatter = Intl.NumberFormat('en', {
    //@ts-ignore
    notation: 'compact',
  });

	const defiLlamaRes = await fetch('https://api.llama.fi/protocol/popcorn')
	const defiLlamaData = await defiLlamaRes.json()
	const stakingTVL: number = defiLlamaData.currentChainTvls.staking;
	const pool2TVL: number = defiLlamaData.currentChainTvls.pool2;
	const ethereumTVL: number = defiLlamaData.currentChainTvls.Ethereum;
	const formattedTVL = parseInt(
		(stakingTVL + pool2TVL + ethereumTVL).toFixed(2),
	);
	const TotalTVL = formatter.format(formattedTVL);

	
	const butterTVL = await getSetTokenTVL('butter',
    '0x109d2034e97eC88f50BEeBC778b5A5650F98c124',
    '0xCd979A9219DB9A353e29981042A509f2E7074D8B',
		PRC_PROVIDERS[ChainId.Ethereum]
  );

	const threeXTVL = await getSetTokenTVL('threex',
    '0x8b97ADE5843c9BE7a1e8c95F32EC192E31A46cf3',
    '0x42189f909e1EFA409A4509070dDBc31A592422A8',
		PRC_PROVIDERS[ChainId.Ethereum]
  );
	const butterTVLFormatted = formatter.format(Number(formatUnits(butterTVL)))
	const threeXTVLFormatted = formatter.format(Number(formatUnits(threeXTVL)))

	const ethPopStaking = await getStakingTVL('eth',
	'0xeEE1d31297B042820349B03027aB3b13a9406184',
    '0xbba11b41407df8793a89b44ee4b50afad4508555',
		PRC_PROVIDERS[ChainId.Ethereum],
  );

  const polygonPopStaking = await getStakingTVL(
		'polygon',
		'0xe8af04AD759Ad790Aa5592f587D3cFB3ecC6A9dA',
    '0x6dE0500211bc3140409B345Fa1a5289cb77Af1e4',
		PRC_PROVIDERS[ChainId.Polygon],
  );

	const popStaking = formatter.format(Number(formatUnits(ethPopStaking.add(polygonPopStaking))))

	const ethLP = await getPoolSize(
		'eth',
    '0xbba11b41407df8793a89b44ee4b50afad4508555',
		PRC_PROVIDERS[ChainId.Ethereum],
  );

  const polygonLP = await getPoolSize(
		'polygon',
    '0x6dE0500211bc3140409B345Fa1a5289cb77Af1e4',
		PRC_PROVIDERS[ChainId.Polygon],
  );

	const LP = formatter.format(Number(formatUnits(ethLP.add(polygonLP))))

	const tvlProps = [
    {
      name: 'TVL',
      value: `$${TotalTVL}`,
    },
    {
      name: '3X',
      value: `$${threeXTVLFormatted}`,
    },
    {
      name: 'BTR',
      value: `$${butterTVLFormatted}`,
    },
		{
      name: 'LPs',
      value: `$${LP}`,
    },
    {
      name: 'POP Staking',
      value: `$${popStaking}`,
    },
  ];
	return { props: { tvlProps } }
}
