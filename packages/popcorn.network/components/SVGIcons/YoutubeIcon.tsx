import React from 'react'

interface IconProps {
	color: string;
	size: string;
}
const YoutubeIcon:React.FC<IconProps> = ({color, size})  => {
	return (
		<svg width={size} height={size} viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg">
			<g clipPath="url(#clip0_1743_38969)">
				<path d="M19.708 24.3246C14.5862 24.871 9.42075 24.871 4.29892 24.3246C3.3043 24.2195 2.37575 23.7767 1.66804 23.07C0.960338 22.3633 0.516254 21.4354 0.409826 20.4409C-0.136609 15.3191 -0.136609 10.1537 0.409826 5.03183C0.514858 4.03721 0.957639 3.10866 1.66435 2.40095C2.37106 1.69325 3.299 1.24916 4.29346 1.14274C9.41529 0.596301 14.5807 0.596301 19.7026 1.14274C20.6972 1.24777 21.6257 1.69055 22.3334 2.39726C23.0411 3.10397 23.4852 4.03191 23.5916 5.02637C24.1381 10.1482 24.1381 15.3136 23.5916 20.4355C23.4866 21.4301 23.0438 22.3586 22.3371 23.0663C21.6304 23.774 20.7025 24.2181 19.708 24.3246Z" fill={color} />
				<path d="M19.1499 9.12569C18.8499 8.20251 17.8572 7.64342 16.9435 7.51524C13.6573 7.16614 10.3434 7.16614 7.05715 7.51524C6.14352 7.64342 5.14806 8.19706 4.85079 9.12569C4.38307 11.5089 4.38307 13.9602 4.85079 16.3434C5.15079 17.2652 6.14352 17.8257 7.05715 17.9539C10.3434 18.303 13.6573 18.303 16.9435 17.9539C17.8572 17.8257 18.8526 17.2721 19.1499 16.3434C19.6176 13.9602 19.6176 11.5089 19.1499 9.12569ZM10.2058 15.6084V9.85933L14.8858 12.7339C13.3081 13.7034 11.7767 14.643 10.2058 15.6084Z" fill="white" />
			</g>
			<defs>
				<clipPath id="clip0_1743_38969">
					<rect width="24" height="24" fill="white" transform="translate(0 0.733887)" />
				</clipPath>
			</defs>
		</svg>
	)
}

export default YoutubeIcon