import MobileCardSlider from 'components/CommonComponents/MobileCardSlider';
import SliderContainer from 'components/CommonComponents/SliderContainer';
import React, { useEffect } from 'react'
import Lottie from 'react-lottie';
import doWellAnim from "../../LottieAnimations/1.json";
import doGoodAnim from "../../LottieAnimations/2.json";
import depositAnim from "../../LottieAnimations/4.json";

const AsSeenSection = () => {
  const doWellOptions = {
    loop: true,
    autoplay: true,
    animationData: doWellAnim,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice"
    }
  };
  const doGoodOptions = {
    loop: true,
    autoplay: true,
    animationData: doGoodAnim,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice"
    }
  };
  const depositOptions = {
    loop: true,
    autoplay: true,
    animationData: depositAnim,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice"
    }
  };


  return (
    <section className=" mt-10">
      <div className="px-6 lg:px-0">
        <h6 className=" font-medium leading-8 mb-3">As Seen In</h6>
        <SliderContainer>
          <img src="/images/As_seen_in/ee.svg" alt="" className="px-2 smmd:px-5 w-10 h-10 object-contain" />
          <img src="/images/As_seen_in/utoday.svg" alt="" className="px-2 smmd:px-5 w-10 h-10 object-contain" />
          <img src="/images/As_seen_in/Finance Magnates.svg" alt="" className="px-2 smmd:px-5 w-10 h-10 object-contain" />
          <img src="/images/As_seen_in/bitcoinist.png" alt="" className="px-2 smmd:px-5 w-10 h-10 object-contain" />
          <img src="/images/As_seen_in/newsbtc.svg" alt="" className="px-2 smmd:px-5 w-10 h-10 object-contain" />
          <img src="/images/As_seen_in/cryptopotato.svg" alt="" className="px-2 smmd:px-5 w-10 h-10 object-contain" />
          <img src="/images/As_seen_in/digital.png" alt="" className="px-2 smmd:px-5 w-10 h-10 object-contain" />
        </SliderContainer>
      </div>
      <div className="hidden smmd:grid grid-cols-3 gap-8 xl:gap-14 mt-9 px-6 lg:px-0">
        <div className="col-span-3 smmd:col-span-1 cursor-default">
          <Lottie
            options={depositOptions}
            width="auto"
            height="auto"
          />
          <p className="text-black text-3xl leading-9 mt-6 mb-4">Deposit</p>
          <p className="text-primaryDark leading-5">Deposit your stablecoins and blue chip crypto assets.</p>
        </div>

        <div className="col-span-3 smmd:col-span-1 cursor-default">
          <Lottie
            options={doWellOptions}
            width="auto"
            height="auto"
          />
          <p className="text-black text-3xl leading-9 mt-6 mb-4">Do Well</p>
          <p className="text-primaryDark leading-5">Optimize your returns with non-custodial, liquid asset strategies.</p>
        </div>

        <div className="col-span-3 smmd:col-span-1 cursor-default">
          <Lottie
            options={doGoodOptions}
            width="auto"
            height="auto"
          />
          <p className="text-black text-3xl leading-9 mt-6 mb-4">Do Good</p>
          <p className="text-primaryDark leading-5">Fund community-selected nonprofit and social impact organizations at no additional cost.</p>
        </div>
      </div>

      <div className="flex flex-col">
        <div className=' pt-16 px-6 lg:px-0 order-2'>
          <h6 className=" font-medium leading-8 mb-3">Built With</h6>
          <SliderContainer slidesToShow={4}>
            <img src="/images/builtWithLogos/curve.svg" alt="" className="px-2 smmd:px-5 w-10 h-10 object-contain" />
            <img src="/images/builtWithLogos/synthetix.svg" alt="" className="px-2 smmd:px-5 w-10 h-10 object-contain" />
            <img src="/images/builtWithLogos/setLogo.svg" alt="" className="px-2 smmd:px-5 w-10 h-10 object-contain" />
            <img src="/images/builtWithLogos/yearn.svg" alt="" className="px-2 smmd:px-5 w-10 h-10 object-contain" />
            <img src="/images/builtWithLogos/uniswap.svg" alt="" className="px-2 smmd:px-5 w-10 h-10 object-contain" />
          </SliderContainer>
        </div>

        {/* Carousel for Mobile */}
        <div className="smmd:hidden mt-11 order-1">
          <MobileCardSlider>
            <div className="px-6">
              <Lottie
                options={depositOptions}
                width="auto"
                height="auto"
              />
              <p className="text-black text-3xl leading-9 mt-6 mb-4">Deposit</p>
              <p className="text-primaryDark leading-5">Deposit your stablecoins and blue chip crypto assets.</p>
            </div>
            <div className="px-6">

              <Lottie
                options={doWellOptions}
                width="auto"
                height="auto"
              />
              <p className="text-black text-3xl leading-9 mt-6 mb-4">Do Well</p>
              <p className="text-primaryDark leading-5">Optimize your returns with non-custodial, liquid asset strategies.</p>
            </div>

            <div className="px-6">
              <Lottie
                options={doGoodOptions}
                width="auto"
                height="auto"
              />
              <p className="text-black text-3xl leading-9 mt-6 mb-4">Do Good</p>
              <p className="text-primaryDark leading-5">Fund community-selected nonprofit and social impact organizations at no additional cost.</p>
            </div>
          </MobileCardSlider>
        </div>
      </div>
    </section>
  )
}

export default AsSeenSection