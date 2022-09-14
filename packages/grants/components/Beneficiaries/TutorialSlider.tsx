import React, { useRef, useState } from "react";
import Slider from "react-slick";

let activeDot = "bg-black";
let inactiveDot = "bg-black bg-opacity-50";

const TutorialSlider = ({ isThreeX }: { isThreeX: boolean }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const customSlider = useRef(null);

  const gotoSlide = (id: any) => {
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
      content:
        "Grants are awarded to a set number of top-ranking beneficiaries as voted on by the $POP-token holders.",
    }
  ];
  return (
    <div className="relative">
      <Slider {...settings} ref={(slider) => (customSlider.current = slider)}>
        {tutorialSteps.map((step, index) => (
          <div key={index}>
            <div className=" bg-pink rounded-lg p-8 flex flex-col justify-between text-black">
              <h6 className="text-base text-black">Learn how it works</h6>

              <div className="py-6 text-black">
                <h3 className="font-medium text-2xl mb-2 leading-[110%]">{step.title}</h3>
                <p className="leading-[140%]">{step.content}</p>
              </div>

              <div className="flex justify-end pt-6 space-x-4">
                {tutorialSteps.map((_, index) => (
                  <div
                    key={index}
                    className={`${currentSlide == index ? activeDot : inactiveDot} rounded-full h-3 w-3 transition-all`}
                    onClick={() => gotoSlide(index)}
                  ></div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </Slider>
    </div>
  );
};

export default TutorialSlider;
