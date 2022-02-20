import ContentLoader from "react-content-loader";

export default function StakeInterfaceLoader(): JSX.Element {
  return (
    <>
      <div className="md:w-2/3 mt-14">
        <ContentLoader speed={1} viewBox="0 0 500 84">
          <rect x="9" y="4" rx="10" ry="10" width="320" height="22" />
          <rect x="18" y="14" rx="10" ry="10" width="303" height="6" />
          <rect x="11" y="33" rx="10" ry="10" width="108" height="13" />
          <rect x="129" y="33" rx="10" ry="10" width="60" height="13" />
          <rect x="196" y="33" rx="10" ry="10" width="60" height="13" />
        </ContentLoader>
      </div>
      <div className="flex flex-col md:flex-row mt-10 mx-4">
        <div className="md:w-1/3">
          <ContentLoader viewBox="0 0 450 600">
            <rect x="0" y="0" rx="20" ry="20" width="400" height="600" />
          </ContentLoader>
        </div>
        <div className="md:w-2/3 md:ml-12">
          <ContentLoader viewBox="0 0 450 400">
            <rect x="0" y="0" rx="15" ry="15" width="388" height="108" />
            <rect x="0" y="115" rx="15" ry="15" width="388" height="216" />
          </ContentLoader>
        </div>
      </div>
    </>
  );
}
