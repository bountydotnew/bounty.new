import type React from 'react';

export const UserIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
    role="img"
    aria-label="User"
  >
    <path
      d="M6.75 8C6.75 5.1005 9.1005 2.75 12 2.75C14.8995 2.75 17.25 5.1005 17.25 8C17.25 10.8995 14.8995 13.25 12 13.25C9.1005 13.25 6.75 10.8995 6.75 8Z"
      fill="currentColor"
    />
    <path
      d="M4.25 20.5C4.25 16.2198 7.71979 12.75 12 12.75C16.2802 12.75 19.75 16.2198 19.75 20.5C19.75 20.9142 19.4142 21.25 19 21.25H5C4.58579 21.25 4.25 20.9142 4.25 20.5Z"
      fill="currentColor"
    />
  </svg>
);
