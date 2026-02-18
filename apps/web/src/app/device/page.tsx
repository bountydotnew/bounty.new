import type { Metadata } from 'next';
import DevicePage from './page-client';

export const metadata: Metadata = {
  title: 'Device Authorization',
  description: 'Authorize this device',
};

export default function Page() {
  return <DevicePage />;
}
