import { ChevronLeftIcon } from "@heroicons/react/outline";
import React, { useRef, useState } from "react";
import Slider from "react-slick";

let inactiveDot = "bg-white border border-black";
let activeDot = "bg-black";
interface MobileTutorialSlider {
  onCloseMenu: React.MouseEventHandler<SVGSVGElement>;
}

const MobileTutorialSlider: React.FC<MobileTutorialSlider> = ({ onCloseMenu }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const customSlider = useRef(null);

  const gotoSlide = (id: number) => {
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
  const tutorialSteps: Array<{ title: string; content: string }> = [
    {
      title: "Step 1 - Nominate an organization",
      content:
        "An organization wishing to apply for eligible beneficiary status may acquire the requisite number of 2000 $POP tokens to raise a Beneficiary Nomination Proposal. Alternatively they may reach out to the Popcorn Foundation to seek a nomination at no cost..",
    },
    {
      title: "Step 2 - Vote",
      content:
        "In order to accept eligible beneficiaries, we use a two-phase binary voting process (Accept or Reject). Following these two voting rounds, a voice credit allocation voting process will be held in the Grant Rounds section of our website.",
    },
    {
      title: "Step 3 - Organization get funded",
      content: "Grants are awarded to a set number of top-ranking beneficiaries as voted on by the $POP-token holders.",
    },
  ];
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  return (
    <div className="px-6 py-12 bg-white">
      <div className="relative">
        <ChevronLeftIcon
          className="text-black h-10 w-10 absolute left-0 transform -translate-y-1/2 top-1/2"
          onClick={onCloseMenu}
        />
        <p className="text-black text-center font-medium leading-[140%]">How It Works</p>
      </div>
      <div className="mt-20 mobileTutorialSlider">
        <Slider {...settings} ref={(slider) => (customSlider.current = slider)}>
          {tutorialSteps.map((step, index) => (
            <div className="h-screen">
              <div className={`"px-2 flex flex-col justify-between ${isIOS ? "h-112" : "h-[70%]"}`}>
                <div>
                  <h1 className="text-black text-5xl leading-11">{step.title}</h1>
                  <p className=" text-black leading-[140%] mt-4">{step.content}</p>
                </div>

                <div className="flex justify-center pt-6 gap-5">
                  {tutorialSteps.map((steps, index) => (
                    <div
                      className={`${
                        currentSlide == index ? activeDot : inactiveDot
                      } rounded-full h-4 w-4 transition-all`}
                      onClick={() => gotoSlide(index)}
                    ></div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </Slider>
      </div>
    </div>
  );
};

export default MobileTutorialSlider;
