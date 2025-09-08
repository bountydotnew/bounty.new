'use client';

import { motion } from 'framer-motion';

interface NumberFlowProps {
  value: number;
}

export default function NumberFlow({ value }: NumberFlowProps) {
  return <motion.span>{value.toLocaleString()}</motion.span>;
}
