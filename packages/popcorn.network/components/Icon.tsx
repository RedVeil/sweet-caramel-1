interface IconProps {
  type: 'check' | 'x';
}

export default function Icon({ type }: IconProps): JSX.Element {
  return type === 'check' ? (
    <svg
      className="flex-shrink-0 h-6 w-6 text-green-500"
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
        d="M5 13l4 4L19 7"
      />
    </svg>
  ) : (
    <svg
      className="flex-shrink-0 h-6 w-6 text-red-500"
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        fill="currentcolor"
        d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"
      />
    </svg>
  );
}
