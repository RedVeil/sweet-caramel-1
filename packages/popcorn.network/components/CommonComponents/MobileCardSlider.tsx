import React, {useState, useRef} from 'react'
import Slider from "react-slick";

let activeDot = "bg-black";
let inactiveDot = "bg-white";

const MobileCardSlider = ({ children }) => {
	const [currentSlide, setCurrentSlide] = useState(0);

	const customSlider = useRef(null);

	const gotoSlide = (id) => {
		setCurrentSlide(id)
		customSlider.current.slickGoTo(id)
	}

	const settings = {
		dots: false,
		infinite: true,
		speed: 500,
		slidesToShow: 1,
		slidesToScroll: 1,
		autoplay: false,
		easing: "easeInOut",
		pauseOnHover: false,
		arrows:false,
		swipe:true,
		beforeChange: (oldIndex: number, newIndex: number) => {
			setCurrentSlide(newIndex);
		},
	};
	return (
		<div>
			<Slider {...settings} ref={slider => (customSlider.current = slider)}>
				{children}
			</Slider>
			 <div className="flex justify-center pt-6 gap-5">
			 <div className={`${currentSlide == 0 ? activeDot : inactiveDot} rounded-full h-5 w-5 border border-black transition-all`} onClick={()=>gotoSlide(0)}></div>
				 <div className={`${currentSlide == 1 ? activeDot : inactiveDot} rounded-full h-5 w-5 border border-black transition-all`} onClick={()=>gotoSlide(1)}></div>
				 <div className={`${currentSlide == 2 ? activeDot : inactiveDot} rounded-full h-5 w-5 border border-black transition-all`} onClick={()=>gotoSlide(2)}></div>
		 </div>
		</div>
	)
}

export default MobileCardSlider