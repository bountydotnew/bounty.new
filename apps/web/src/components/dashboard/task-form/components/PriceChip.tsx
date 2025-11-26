import { useRef } from 'react';
import { Controller, type Control } from 'react-hook-form';
import type { CreateBountyForm } from '@bounty/ui/lib/forms';
import { calculateWidth } from '@bounty/ui/lib/calculateWidth';

interface PriceChipProps {
    control: Control<CreateBountyForm>;
}

export function PriceChip({ control }: PriceChipProps) {
    const priceRef = useRef<HTMLInputElement>(null);

    return (
        <div className="rounded-[7px] flex flex-row items-center px-1.5 py-[3px] bg-[#201F1F] gap-1">
            <span className="text-[#5A5A5A] text-[16px] leading-5 font-normal">$</span>
            <Controller
                control={control}
                name="amount"
                render={({ field }) => (
                    <input
                        ref={(e) => {
                            if (e) {
                                priceRef.current = e;
                                field.ref(e);
                            }
                        }}
                        type="text"
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value.replace(/[^0-9.]/g, ''))}
                        placeholder="Price"
                        className="bg-transparent text-white text-[16px] leading-5 outline-none placeholder:text-[#5A5A5A]"
                        style={{ width: `${calculateWidth(field.value, 40)}px` }}
                    />
                )}
            />
        </div>
    );
}

