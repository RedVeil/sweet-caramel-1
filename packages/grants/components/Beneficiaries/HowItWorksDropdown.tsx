import { useState } from "react";
import Slider from "react-slick";
import { Transition } from "react-transition-group";

const HowItWorksDropdown = () => {
  const [showDropDown, setshowDropDown] = useState<boolean>(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const processList: Array<{
    title: string;
    text: string;
    image: string;
  }> = [
    {
      title: "Nominate an Organization",
      text: "An organization wishing to apply for eligible beneficiary status may acquire the requisite number of 2000 $POP tokens to raise a Beneficiary Nomination Proposal. Alternatively they may reach out to the Popcorn Foundation to seek a nomination at no cost.",
      image: "/images/nominateCat.svg",
    },
    {
      title: "Vote",
      text: "In order to accept eligible beneficiaries, we use a two-phase binary voting process (Accept or Reject). Following these two voting rounds, a voice credit allocation voting process will be held in the Grant Rounds section of our website.",
      image: "/images/voteCat.svg",
    },
    {
      title: "Organization get funded",
      text: "Grants are awarded to a set number of top-ranking beneficiaries as voted on by the $POP-token holders.",
      image: "/images/organizeCat.svg",
    },
  ];
  const defaultStyles = {
    transition: `all 300ms ease-in-out`,
    opacity: 0,
    height: "0px",
  };

  const transitionStyles = {
    entering: { opacity: 1, height: "100%" },
    entered: { opacity: 1, height: "100%" },
    exiting: { opacity: 0, height: "0px" },
    exited: { opacity: 0, height: "0px" },
    unmounted: { opacity: 0, height: "0px" },
  };

  const sliderSettings = {
    dots: false,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    draggable: true,
    arrows: false,
    autoplay: showDropDown,
    autoplaySpeed: 5000,
    easing: "ease-in",
    beforeChange: (oldIndex: number, newIndex: number) => {
      setCurrentSlide(newIndex);
    },
  };

  let activeDot = "bg-gray-900 border-gray-200";
  let inactiveDot = "bg-gray-200";
  return (
    <section className="bg-yellow py-20 transition-all">
      <div className="container mx-auto">
        <div className="flex justify-between px-5 lg:px-10 items-center">
          <p className=" text-xl md:text-3xl text-gray-900 font-semibold">Learn how it works!</p>
          <div
            className="rounded-full h-16 w-16 bg-white border border-gray-200 flex justify-center items-center"
            onClick={() => setshowDropDown(!showDropDown)}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className={`${showDropDown ? "rotate-180" : "rotate-0"} transform transition-all ease-in-out`}
            >
              <path d="M6 9L12 15L18 9" stroke="#2563EB" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
        <div className="hidden lg:block">
          <Transition in={showDropDown} timeout={300}>
            {(state) => (
              <div
                className="grid grid-cols-12 gap-20 md:px-10"
                style={{
                  ...defaultStyles,
                  ...transitionStyles[state],
                }}
              >
                {processList.map((process, index) => (
                  <div
                    className="col-span-12 md:col-span-4 w-screen md:w-full px-16 md:px-0 flex flex-col text-center pt-10"
                    key={index}
                  >
                    <img src={process.image} alt="" className="w-40 mx-auto mb-10" />
                    <div className="flex flex-col justify-center h-60">
                      <h6 className=" text-gray-900 text-2xl font-semibold mb-3">{process.title}</h6>
                      <p className=" text-lg text-gray-500">{process.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Transition>
        </div>
        <div className="block lg:hidden">
          {showDropDown && (
            <>
              <Slider {...sliderSettings}>
                {processList.map((process, index) => (
                  <div className="w-screen px-16 pt-20 flex flex-col justify-center text-center" key={index}>
                    <img src={process.image} alt="" className="w-40 mx-auto mb-10" />
                    <h6 className=" text-gray-900 text-2xl font-semibold mb-3">{process.title}</h6>
                    <p className=" text-lg text-gray-500">{process.text}</p>
                  </div>
                ))}
              </Slider>
              <div className="flex justify-center pt-10 gap-5">
                {processList.map((process, index) => (
                  <div
                    className={`${
                      currentSlide == index ? "bg-gray-200" : "bg-transparent"
                    } rounded-full h-6 w-6 flex justify-center items-center`}
                    key={index}
                  >
                    <div className={`${currentSlide == index ? activeDot : inactiveDot} rounded-full h-3 w-3`}></div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksDropdown;
