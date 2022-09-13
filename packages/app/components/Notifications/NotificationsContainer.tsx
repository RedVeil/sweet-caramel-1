/* This example requires Tailwind CSS v2.0+ */
import { Transition } from '@headlessui/react';
import { Fragment, useContext, useEffect } from 'react';
import { hideNotification, unsetNotification } from '../../context/actions';
import { store } from '../../context/store';
import Image from "next/image";


const NotificationsContainer: React.FC = () => {
  const {
    dispatch,
    state: { notifications },
  } = useContext(store);

  useEffect(() => {
    const timeouts = [];
    const intId = setInterval(() => {
      notifications.map((notification) => {
        if (notification.isFlash) {
          const id = setTimeout(() => {
            dispatch(hideNotification(notification.id));
          }, 7000);
          timeouts.push(id);
        }
      });
    }, 1000);

    return () => {
      clearInterval(intId);
      timeouts.map((timeout) => clearTimeout(timeout));
    };
  }, [notifications]);

  return (
    <>
      {/* Global notification live region, render this permanently at the end of the document */}
      <div
        aria-live="assertive"
        className="fixed inset-0 flex px-4 py-6 pointer-events-none sm:p-6 items-start sm:justify-end z-100"
      >
        {/* Notification panel, dynamically insert this into the live region when it needs to be displayed */}
        {notifications &&
          notifications.map((notification) => (
            <Transition
              appear={true}
              key={notification.id}
              show={notification.visible}
              as={Fragment}
              enter="transform ease-out duration-300 transition"
              enterFrom="translate-y-10 opacity-0 sm:translate-y-0 sm:translate-x-10"
              enterTo="translate-y-0 opacity-100 sm:translate-x-0"
              leave="transition ease-in duration-300 transition"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
              afterLeave={() => {
                dispatch(unsetNotification(notification.id));
              }}
            >
              <div className="m-4 max-w-sm w-full bg-white shadow-notificationShadow rounded-lg pointer-events-auto overflow-hidden block ">
                <div className=" py-6 pl-6 pr-8">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-8 h-8">
                      <Image
                        src={`/images/icons/${notification.type}.svg`}
                        alt={notification.type}
                        width="100"
                        height="100"
                      />
                    </div>
                    <div className="w-0 flex-1 pt-0.5 ml-6">
                      <p className="text-base leading-6 font-medium text-black">
                        {notification.title}
                      </p>
                      <p className="mt-2 text-xl text-primaryDark font-normal">
                        {notification.content}
                      </p>
                      <button
                        className='text-customPurple font-semibold text-base leading-6 mt-2'
                        onClick={() => {
                          dispatch(hideNotification(notification.id));
                        }}
                      >Dismiss</button>
                    </div>
                  </div>
                </div>
              </div>
            </Transition>
          ))}
      </div>
    </>
  );
};
export default NotificationsContainer;
