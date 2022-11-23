import React, { useState } from 'react'

const Hero = () => {
	const [showControls, setShowControls] = useState<boolean>(false)
	const playVideo = () => {
		
		const video = document.getElementById('video') as HTMLVideoElement | null;
		console.log(video);
		
		if (video != null) {
			setShowControls(true)
			video.play();
		}

		video.onended = () => {
			setShowControls(false)		
		}
	}
	return (
	<section className="relative">
		<img src="/images/zigzag.svg" alt="" className="hidden lg:block absolute z-30 top-10 -left-20"/>
		<section className="rounded w-full h-full relative">
			<video className="w-full h-full" id='video' controls poster='/images/explainer_video.svg'>
				<source src="/videos/Popcorn_V4.1.mp4"  type="video/mp4" />
			</video>
		</section>
	</section>
	)
}

export default Hero