import type { Metadata } from 'next';
import DevicePage from './_client';

export const metadata: Metadata = {
  title: 'Device Authorization',
  description: 'Authorize this device',
};

export default function Page() {
  return <DevicePage />;
}
