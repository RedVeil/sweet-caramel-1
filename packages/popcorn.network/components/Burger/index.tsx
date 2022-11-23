import React from 'react';
import Link from 'next/link'

interface StyledBurgerProps {
	open: boolean;
}

const Burger = ({ open, setOpen, ...props }) => {
	return (
        <div className={`flex justify-between items-center w-full z-40 bg-white ${open ? 'fixed left-0 top-0 py-8 px-6' : 'static'}`}>
			{<Link href="/">
                	<img src="/images/logo.svg" alt="Popcorn Logo" />
            </Link>}
			<button
				className="text-gray-500 w-10 relative focus:outline-none bg-white"
				onClick={() => setOpen(!open)}
			>
				<div className="block w-10">
					<span
						aria-hidden="true"
						className={`block h-1 w-10 bg-black transform transition duration-500 ease-in-out rounded-3xl ${open ? "rotate-45 translate-y-1" : "-translate-y-2.5"
							}`}
					></span>
					<span
						aria-hidden="true"
						className={`block h-1 w-10 bg-black transform transition duration-500 ease-in-out rounded-3xl ${open ? "opacity-0" : "opacity-100"
							}`}
					></span>
					<span
						aria-hidden="true"
						className={`block h-1 w-10 bg-black transform transition duration-500 ease-in-out rounded-3xl ${open ? "-rotate-45 -translate-y-1" : "translate-y-2.5"
							}`}
					></span>
				</div>
			</button>
		</div>
    );
};

export default Burger;
