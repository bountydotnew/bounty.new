'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface ContractAddressProps {
  address: string;
}

export function ContractAddress({ address }: ContractAddressProps) {
  const [copied, setCopied] = useState(false);

  const copyAddress = async () => {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-[29px] px-3 rounded-[7px] bg-[#303030] text-[13px] text-[#888] flex items-center gap-2 font-mono">
      <span className="hidden sm:inline">CA:</span>
      <span className="max-w-[120px] truncate sm:max-w-[200px]">{address}</span>
      <button
        type="button"
        onClick={copyAddress}
        className="text-[#666] hover:text-white transition-colors"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-white" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </button>
    </div>
  );
}
