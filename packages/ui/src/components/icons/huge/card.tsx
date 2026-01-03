import type React from 'react';

export const CardIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
    role="img"
    aria-label="Card"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M1 5.75C1 4.23122 2.23122 3 3.75 3H19.75C21.2688 3 22.5 4.23122 22.5 5.75V8H1V5.75ZM1 9.5H22.5V17.75C22.5 19.2688 21.2688 20.5 19.75 20.5H3.75C2.23122 20.5 1 19.2688 1 17.75V9.5ZM9.75 15C9.33579 15 9 15.3358 9 15.75C9 16.1642 9.33579 16.5 9.75 16.5H11.25C11.6642 16.5 12 16.1642 12 15.75C12 15.3358 11.6642 15 11.25 15H9.75ZM14.25 15C13.8358 15 13.5 15.3358 13.5 15.75C13.5 16.1642 13.8358 16.5 14.25 16.5H17.75C18.1642 16.5 18.5 16.1642 18.5 15.75C18.5 15.3358 18.1642 15 17.75 15H14.25Z"
      fill="currentColor"
    />
  </svg>
);
