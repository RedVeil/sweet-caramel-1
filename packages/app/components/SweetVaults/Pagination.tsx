import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/outline";
import React, { useEffect, useState } from "react";

interface PaginationProps {
  onUpdatePage: Function;
  sliceAmount: number;
  lengthOfData: number;
  currentPage: number;
  setCurrentPage: any;
}
const Pagination: React.FC<PaginationProps> = ({
  onUpdatePage,
  sliceAmount,
  lengthOfData,
  currentPage,
  setCurrentPage,
}) => {
  const [noOfPages, setNoOfPages] = useState<number>(1);

  useEffect(() => {
    setNoOfPages(Math.ceil(lengthOfData / sliceAmount));
  }, []);

  const updateSlicePosition = (index: number) => {
    onUpdatePage(index * sliceAmount);
    setCurrentPage(index);
  };

  const addSlicePosition = (index: number) => {
    if ((index + 1) * sliceAmount < lengthOfData) {
      onUpdatePage((index + 1) * sliceAmount);
      setCurrentPage(index + 1);
    }
  };

  const subtractSlicePosition = (index: number) => {
    if (index !== 0) {
      onUpdatePage((index - 1) * sliceAmount);
      setCurrentPage(index - 1);
    }
  };
  return (
    <>
      <div className="flex justify-between">
        <div
          className="w-7 h-7 rounded-full border border-black flex justify-center items-center"
          onClick={() => subtractSlicePosition(currentPage)}
        >
          <ChevronLeftIcon className="cursor-pointer text-black w-4" />
        </div>

        <div className="flex gap-6 md:gap-0 md:space-x-6">
          {[...Array(noOfPages)].map((e, i) => (
            <p
              key={i}
              onClick={() => updateSlicePosition(i)}
              role="button"
              className={currentPage == i ? "text-black" : "text-primary"}
            >
              {i + 1}
            </p>
          ))}
        </div>
        <div
          className="w-7 h-7 rounded-full border border-black flex justify-center items-center"
          onClick={() => addSlicePosition(currentPage)}
        >
          <ChevronRightIcon className="cursor-pointer text-black w-4" />
        </div>
      </div>
    </>
  );
};

export default Pagination;
