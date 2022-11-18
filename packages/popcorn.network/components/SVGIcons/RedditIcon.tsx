import React from 'react'

interface IconProps {
	color: string;
	size: string;
}
const RedditIcon:React.FC<IconProps> = ({color, size}) => {
	return (
		<svg width={size} height={size} viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg">
			<g clipPath="url(#clip0_1743_38967)">
				<path d="M21.325 10.0419C20.567 10.0419 19.9 10.3609 19.409 10.8579C17.604 9.58989 15.17 8.77389 12.473 8.68689L13.874 2.28089L18.335 3.29689C18.335 4.40489 19.225 5.30989 20.317 5.30989C21.43 5.30989 22.325 4.38089 22.325 3.27189C22.325 2.16289 21.436 1.23389 20.318 1.23389C19.539 1.23389 18.867 1.71089 18.532 2.36289L13.605 1.25489C13.357 1.18789 13.114 1.36789 13.048 1.61989L11.51 8.68189C8.83396 8.79489 6.42596 9.60989 4.61496 10.8789C4.12396 10.3609 3.43096 10.0419 2.67296 10.0419C-0.139038 10.0419 -1.06004 13.8709 1.51496 15.1799C1.42396 15.5849 1.38296 16.0169 1.38296 16.4479C1.38296 20.7489 6.15796 24.2339 12.021 24.2339C17.909 24.2339 22.684 20.7489 22.684 16.4479C22.684 16.0169 22.639 15.5649 22.528 15.1589C25.051 13.8449 24.122 10.0439 21.325 10.0419ZM5.60096 15.4519C5.60096 14.3229 6.49096 13.4139 7.60896 13.4139C8.70096 13.4139 9.59196 14.3169 9.59196 15.4519C9.59196 16.5609 8.70196 17.4649 7.60896 17.4649C6.49596 17.4699 5.60096 16.5609 5.60096 15.4519ZM16.44 20.2499C14.599 22.1179 9.40396 22.1179 7.56196 20.2499C7.35896 20.0699 7.35896 19.7519 7.56196 19.5469C7.73896 19.3669 8.05296 19.3669 8.22996 19.5469C9.63596 21.0099 14.3 21.0349 15.767 19.5469C15.944 19.3669 16.258 19.3669 16.435 19.5469C16.642 19.7529 16.642 20.0709 16.44 20.2499ZM16.399 17.4689C15.307 17.4689 14.417 16.5659 14.417 15.4579C14.417 14.3289 15.307 13.4199 16.399 13.4199C17.512 13.4199 18.407 14.3229 18.407 15.4579C18.402 16.5609 17.512 17.4689 16.399 17.4689Z" fill={color} />
			</g>
			<defs>
				<clipPath id="clip0_1743_38967">
					<rect width="24" height="24" fill="white" transform="translate(0 0.733887)" />
				</clipPath>
			</defs>
		</svg>
	)
}

export default RedditIcon