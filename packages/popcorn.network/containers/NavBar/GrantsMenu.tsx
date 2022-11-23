import React from 'react';
import { useRouter } from 'next/router';
import NavbarLink from './NavbarLinks';

interface Props {
  visible: boolean;
  toggleSubMenu: Function;
}
export const GrantsMenu: React.FC<Props> = ({ visible, toggleSubMenu }) => {
  const router = useRouter();
  if (!visible) return <></>;
  return (
    <div className="absolute z-10 left-1/3 transform  -translate-x-1 mt-5 px-2 w-screen max-w-xs sm:px-0">
      <nav
        className="mx-auto px-4 py-8 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5"
        aria-labelledby="solutionsHeading"
      >
        <div>
          <ul className="space-y-6">
            <li className="flow-root">
              <span className="-m-3 p-3 flex items-center text-base font-medium text-gray-900 hover:bg-gray-50 transition ease-in-out duration-150">
                <svg
                  className="flex-shrink-0 h-6 w-6 text-gray-400"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="ml-4">
                  <NavbarLink
                    label="View All Elections"
                    url="/grant-elections/all"
                    onClick={toggleSubMenu}
                    isActive={router.pathname === '/grants'}
                  />
                </span>
              </span>
            </li>
            <li className="flow-root">
              <span className="-m-3 p-3 flex items-center text-base font-medium text-gray-900 hover:bg-gray-50 transition ease-in-out duration-150">
                <svg
                  className="flex-shrink-0 h-6 w-6 text-gray-400"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="ml-4">
                  <NavbarLink
                    label="Monthly Election"
                    url="/grant-elections/monthly"
                    onClick={toggleSubMenu}
                    isActive={router.pathname === '/grants'}
                  />
                </span>
              </span>
            </li>
            <li className="flow-root">
              <span className="-m-3 p-3 flex items-center text-base font-medium text-gray-900 hover:bg-gray-50 transition ease-in-out duration-150">
                <svg
                  className="flex-shrink-0 h-6 w-6 text-gray-400"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="ml-4">
                  <NavbarLink
                    label="Quarterly Election"
                    url="/grant-elections/quarterly"
                    onClick={toggleSubMenu}
                    isActive={router.pathname === '/grants'}
                  />
                </span>
              </span>
            </li>
            <li className="flow-root">
              <span className="-m-3 p-3 flex items-center text-base font-medium text-gray-900 hover:bg-gray-50 transition ease-in-out duration-150">
                <svg
                  className="flex-shrink-0 h-6 w-6 text-gray-400"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="ml-4">
                  <NavbarLink
                    label="Yearly Election"
                    url="/grant-elections/yearly"
                    onClick={toggleSubMenu}
                    isActive={router.pathname === '/grants'}
                  />
                </span>
              </span>
            </li>

            <li className="flow-root">
              <span className="-m-3 p-3 flex items-center text-base font-medium text-gray-900 hover:bg-gray-50 transition ease-in-out duration-150">
                <svg
                  className="flex-shrink-0 h-6 w-6 text-gray-400"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
                <span className="ml-4">
                  <NavbarLink
                    label="Register for a Grant Election"
                    url="/grant-elections/register"
                    onClick={toggleSubMenu}
                    isActive={router.pathname === '/grant-elections/register'}
                  />
                </span>
              </span>
            </li>
          </ul>
        </div>
      </nav>
    </div>
  );
};
