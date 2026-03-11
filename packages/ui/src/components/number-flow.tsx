'use client';

import { m } from 'motion/react';

interface NumberFlowProps {
  value: number;
}

export default function NumberFlow({ value }: NumberFlowProps) {
  return <m.span>{value.toLocaleString()}</m.span>;
}
