import SliderContainer from "components/CommonComponents/SliderContainer";
import React from "react";

const PartnersSection = () => {
  return (
    <section className="px-8 mt-20">
      <h6 className=" font-medium leading-8">Partners</h6>
      <SliderContainer>
        <img src="/images/Partners/banklessdao.png" alt="" className="px-2 smmd:px-5 w-10 h-10 object-contain" />
        <img src="/images/Partners/ohm.svg" alt="" className="px-2 smmd:px-5 w-10 h-10 object-contain" />
        <img src="/images/Partners/giveth.svg" alt="" className="px-2 smmd:px-5 w-10 h-10 object-contain" />
        <img src="/images/Partners/newform.svg" alt="" className="px-2 smmd:px-5 w-10 h-10 object-contain" />
        <img src="/images/Partners/kenetic.svg" alt="" className="px-2 smmd:px-5 w-10 h-10 object-contain" />
        <img src="/images/Partners/bigbrainholding.svg" alt="" className="px-2 smmd:px-5 w-10 h-10 object-contain" />
        <img src="/images/Partners/hesticholdings.svg" alt="" className="px-2 smmd:px-5 w-10 h-10 object-contain" />
        <img src="/images/Partners/jumpcap.png" alt="" className="px-2 smmd:px-5 w-10 h-10 object-contain" />
        <img src="/images/Partners/theLAO.png" alt="" className="px-2 smmd:px-5 w-10 h-10 object-contain" />
        <img src="/images/Partners/xbto.png" alt="" className="px-2 smmd:px-5 w-10 h-10 object-contain" />
      </SliderContainer>
    </section>
  );
};

export default PartnersSection;
