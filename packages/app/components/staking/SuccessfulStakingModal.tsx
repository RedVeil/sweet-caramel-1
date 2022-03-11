import React from "react";

const TickMarkSVG: React.ReactElement = (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M28.5 16.4072C28.5 23.0346 23.1274 28.4072 16.5 28.4072C9.87258 28.4072 4.5 23.0346 4.5 16.4072C4.5 9.77981 9.87258 4.40723 16.5 4.40723C23.1274 4.40723 28.5 9.77981 28.5 16.4072Z"
      fill="#2563EB"
    />
    <path
      d="M12.5 16.4072L15.1667 19.0739L20.5 13.7406M28.5 16.4072C28.5 23.0346 23.1274 28.4072 16.5 28.4072C9.87258 28.4072 4.5 23.0346 4.5 16.4072C4.5 9.77981 9.87258 4.40723 16.5 4.40723C23.1274 4.40723 28.5 9.77981 28.5 16.4072Z"
      stroke="white"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
);

const SuccessfulStakingModal: React.ReactElement = (
  <div>
    <p className="text-base text-gray-600">Here's what happens when you stake</p>
    <ul className="w-max m-auto mt-5">
      <li className="flex flex-container flex-row w-full m-auto mb-1.5">
        <div className="mr-5">{TickMarkSVG}</div>
        <p className="leading-8 text-base text-gray-600">Earn sweet POP!</p>
      </li>
      <li className="flex flex-container flex-row w-fit w-full m-auto mb-1.5">
        <div className="mr-5">{TickMarkSVG}</div>
        <p className="leading-8 text-base text-gray-600">Support social impact!</p>
      </li>
    </ul>
  </div>
);

export default SuccessfulStakingModal;
