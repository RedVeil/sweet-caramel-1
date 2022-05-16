import styled from "styled-components";

const Hero = () => {
  return (
    <HeroBg className="py-20 flex flex-col justify-center text-white px-5">
      <h1 className="text-center font-semibold text-4xl md:text-6xl mb-4">Popcorn Beneficiaries</h1>
      <p className="text-center text-lg md:text-2xl font-normal">Social impact driven by the people for the people</p>
      <div className="py-10 flex justify-center text-center gap-8">
        <div>
          <p className="font-bold text-2xl md:text-5xl mb-3">240</p>
          <p className=" font-semibold md:text-lg">Eligible Beneficiaries</p>
        </div>
        <div className="h-50 bg-white hr-line"></div>
        <div>
          <p className="font-bold text-2xl md:text-5xl mb-3">500k USD</p>
          <p className=" font-semibold md:text-lg">Total Fund Raised</p>
        </div>
      </div>
    </HeroBg>
  );
};

const HeroBg = styled.div`
  background-image: url("/images/beneficiariesheroBg.png");
  height: 80vh;
  background-repeat: no-repeat;
  background-size: cover;
  @media screen and (max-width: 767px) {
    background-image: url("/images/beneficiariesMobileheroBg.png");
    height: 100vh;
  }
`;

export default Hero;
