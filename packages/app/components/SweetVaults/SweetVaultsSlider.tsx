import React, { useRef, useState } from "react";
import Slider from "react-slick";

let activeDot = "bg-black";
let inactiveDot = "bg-white border border-black bg-opacity-50";

interface SliderProps {
  tutorialSteps: Array<{ title: string; content: string }>;
}

const SweetVaultsSlider: React.FC<SliderProps> = ({ tutorialSteps }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const customSlider = useRef(null);

  const gotoSlide = (id) => {
    setCurrentSlide(id);
    customSlider.current.slickGoTo(id);
  };

  const settings = {
    dots: false,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: false,
    easing: "easeInOut",
    pauseOnHover: false,
    beforeChange: (oldIndex: number, newIndex: number) => {
      setCurrentSlide(newIndex);
    },
  };
  return (
    <div className="w-full">
      <Slider {...settings} ref={(slider) => (customSlider.current = slider)}>
        {tutorialSteps.map(({ title, content }, index) => (
          <div className="border border-customLightGray rounded-lg p-8" key={title}>
            <div className="flex justify-end mb-7">
              <img src="/images/do good.svg" alt="" />
            </div>
            <div className=" h-88">
              <div className="bg-customLightGray w-10 h-10 rounded-full"></div>
              <h5 className="text-black text-xl leading-8 my-2">{title}</h5>
              <p className="text-primaryDark text-xl leading-8">{content}</p>
            </div>
            <div className="flex justify-end pt-6 gap-5 md:gap-0 md:space-x-6">
              {tutorialSteps.map((steps, index) => (
                <div
                  className={`${currentSlide == index ? activeDot : inactiveDot} rounded-full h-5 w-5 transition-all`}
                  onClick={() => gotoSlide(index)}
                ></div>
              ))}
            </div>
          </div>
        ))}
      </Slider>
    </div>
  );
};

export default SweetVaultsSlider;
