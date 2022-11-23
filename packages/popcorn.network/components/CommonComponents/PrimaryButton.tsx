import React, { Children } from 'react'

interface ButtonProps {
	children: React.ReactNode;
	type?: 'button' | 'submit' | 'reset';
	handleClick?: any;
}
const PrimaryButton:React.FC<ButtonProps> = ({children, type = 'button', handleClick}) => {
	return (
		<button 
			type={type}
			onClick={handleClick}
			className='whitespace-nowrap bg-warmGray border-warmGray text-black hover:bg-primary hover:border-primary hover:text-white active:bg-white active:border-primary active:text-primary rounded-4xl px-8 py-3 font-medium text-base transition-all ease-in-out duration-500 w-full'
		>{children}</button>
	)
}

export default PrimaryButton