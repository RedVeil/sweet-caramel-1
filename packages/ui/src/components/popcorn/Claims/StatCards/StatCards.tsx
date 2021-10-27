export const StatCards = ({ children }): JSX.Element => {
  return (
    <div className="relative -mt-12 mb-6 flex flex-row gap-x-4 flex-wrap justify-between grid-rows-1">
      {children}
    </div>
  );
};
