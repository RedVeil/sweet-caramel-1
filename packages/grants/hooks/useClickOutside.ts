import { RefObject, useEffect, useRef } from "react";

const defaultEvents = ["mousedown", "touchstart"];

const useClickOutside = <E extends Event = Event>(
  ref: RefObject<HTMLElement | null>,
  onClickOutside: (event: E) => void,
  events: string[] = defaultEvents,
) => {
  const savedCallback = useRef(onClickOutside);

  useEffect(() => {
    savedCallback.current = onClickOutside;
  }, [onClickOutside]);

  useEffect(() => {
    const handler = (event: any) => {
      const { current: el } = ref;
      el && !el.contains(event.target) && savedCallback.current(event);
    };

    for (const eventName of events) {
      window.addEventListener(eventName, handler);
    }

    return () => {
      for (const eventName of events) {
        window.removeEventListener(eventName, handler);
      }
    };
  }, [events, ref]);
};

export default useClickOutside;
