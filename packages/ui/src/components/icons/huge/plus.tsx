import type { SVGProps } from 'react';

export function PlusIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="currentColor"
      {...props}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 3C12.552 3 13 3.448 13 4V11H20C20.552 11 21 11.448 21 12C21 12.552 20.552 13 20 13H13V20C13 20.552 12.552 21 12 21C11.448 21 11 20.552 11 20V13H4C3.448 13 3 12.552 3 12C3 11.448 3.448 11 4 11H11V4C11 3.448 11.448 3 12 3Z"
      />
    </svg>
  );
}
