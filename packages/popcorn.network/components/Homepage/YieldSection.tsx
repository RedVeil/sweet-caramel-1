import NewsletterSubscription from 'components/CommonComponents/NewsletterSubscription';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';


const YieldSection = ({ tvlProps }) => {
	const [loading, setLoading] = useState<boolean>(true)


	return (
        <section>
			<div className="hidden lg:block">
				<Link href="/">

                    {' '}
                    <img src="/images/logo.svg" alt="Popcorn Logo" />

                </Link>
			</div>
			{
					<div className="flex flex-wrap gap-2 mt-10">
						{tvlProps.map((token, index) => (
							<div
								className="bg-customPeach rounded-lg px-4 py-2 text-primary"
								key={index}
							>
								<span className="font-medium">{token.name} </span>
								{token.value}
							</div>
						))}
					</div>
			}
			<div className="relative flex">
				<h1 className="text-6xl leading-12 mt-8">Yield that <br className='md:hidden'/> counts</h1>
				<img
					src="/images/smallZigzag.svg"
					alt=""
					className="lg:hidden absolute right-0 bottom-0"
				/>
			</div>
			<p className="mt-4 text-primaryDark">
				Decentralized technology drives the future towards a more inclusive and
				transparent financial system.{' '}
			</p>

			<p className="mt-4 text-primaryDark">
				Popcorn is a regenerative yield optimizing protocol with soul.
			</p>

			<p className="mt-4 text-primaryDark">
				It's easy to deposit crypto, optimize yield, and create positive global
				impact at the same time.{' '}
			</p>
			<NewsletterSubscription title="Newsletter" buttonLabel="Sign up" />
		</section>
    );
};

export default YieldSection;