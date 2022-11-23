import Link from 'next/link'
import React, { useRef } from 'react'
import PrimaryButton from './CommonComponents/PrimaryButton'
import { useRouter } from 'next/router';
import Burger from 'components/Burger';
import Menu from 'components/Menu';
import FocusLock from 'react-focus-lock';
import useSubscribeToNewsletter from 'hooks/useSubscribeToNewsLetter';
import TertiaryActionButton from './CommonComponents/TertiaryActionButton';

const navLinks = [
	{
		label: 'Popcorn',
		link: '/',
		target: '_self'
	},
]
const Header = ({ open, setOpen }) => {
	const { showNewsletterModal } = useSubscribeToNewsletter();
	const router = useRouter();
	const node = useRef();
	const menuId = 'main-menu';

	return (
		<header className='grid grid-cols-12 lg:gap-14 pb-10 lg:py-6 bg-white font-landing relative'>
			<div className="col-span-12 flex justify-between items-center lg:hidden">
				<div>
					<Link href="/">
						<img src="/images/logo.svg" alt="Popcorn Logo" />
					</Link>
				</div>
				<div ref={node} className="lg:hidden w-full absolute">
					<FocusLock disabled={!open}>
						<Burger
							open={open}
							setOpen={setOpen}
							aria-controls={menuId}
						/>
						{open && <Menu open={open} setOpen={setOpen} id={menuId} />}
					</FocusLock>
				</div>
			</div>
			<nav className="hidden lg:flex col-span-12 justify-between">
				<div className="flex items-center gap-14">
					{navLinks.map((link, index) => <Link
						key={index}
						href={link.link}
						className={`text-lg hover:text-black ${router.pathname === link.link ? 'text-black font-medium' : 'text-primary'}`}
						target={link.target}>{link.label}</Link>)}
				</div>
				<div className='flex items-center space-x-6'>
					<TertiaryActionButton
						label="Newsletter"
						handleClick={showNewsletterModal}
					></TertiaryActionButton>
					<a href="https://popcorndao.finance/"><PrimaryButton>Launch App</PrimaryButton></a>
				</div>
			</nav>
		</header>
	);
}

export default Header