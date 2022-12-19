export interface PortfolioSectionProps {
  title: string;
  TotalValues: Array<{
    title: string;
    tooltip: JSX.Element;
    value: string | JSX.Element;
    hideMobile: boolean;
  }>;
  children: any;
  NetworkIcons: JSX.Element;
}
const PortfolioSection: React.FC<PortfolioSectionProps> = ({ title, TotalValues, children, NetworkIcons }) => {
  return (
    <>
      <div className="grid grid-cols-12 pb-4 md:pb-0 border-b-[0.5px] md:border-b-0 border-customLightGray">
        <div className="col-span-12 md:col-span-6 flex items-center space-x-5 mb-6 md:mb-[48px]">
          <h2 className="text-2xl md:text-3xl leading-6 md:leading-8">{title}</h2>
          {NetworkIcons}
        </div>
        <div className="col-span-12 md:col-span-6 grid grid-cols-12">
          <div className="col-span-12 xs:col-span-7 xs:col-end-13 md:col-span-12 grid grid-cols-12">
            {TotalValues.map(({ title, tooltip, value, hideMobile }, index) => (
              <div
                className={`text-primary text-lg font-medium col-span-6 md:col-span-4 ${
                  hideMobile ? "hidden md:block" : ""
                }`}
                key={index}
              >
                <div className="flex items-center space-x-2">
                  <p className="text-primaryLight text-sm md:text-base">{title}</p>
                  {tooltip}
                </div>
                <div className="text-sm md:text-lg">{value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div>{children}</div>
    </>
  );
};

export default PortfolioSection;
