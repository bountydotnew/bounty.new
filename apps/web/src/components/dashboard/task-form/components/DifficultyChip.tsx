import { useState } from 'react';
import { Controller, type Control } from 'react-hook-form';
import { ChevronDown, Check } from 'lucide-react';
import { difficultyOptions, type CreateBountyForm } from '@bounty/ui/lib/forms';

interface DifficultyChipProps {
    control: Control<CreateBountyForm>;
}

export function DifficultyChip({ control }: DifficultyChipProps) {
    const [showDifficultyDropdown, setShowDifficultyDropdown] = useState(false);

    return (
        <div className="relative">
            <Controller
                control={control}
                name="difficulty"
                render={({ field }) => (
                    <>
                        <button
                            type="button"
                            onClick={() => setShowDifficultyDropdown(!showDifficultyDropdown)}
                            className="rounded-[7px] flex flex-row items-center px-1.5 py-[3px] bg-[#201F1F] gap-0.5 hover:bg-[#2a2a2a] transition-colors"
                        >
                            <span className={`text-[16px] leading-5 font-normal ${field.value ? 'text-white' : 'text-[#5A5A5A]'}`}>
                                {field.value ? difficultyOptions.find((opt) => opt.value === field.value)?.label : 'Select difficulty'}
                            </span>
                            <ChevronDown
                                className={`w-4 h-4 text-[#5A5A5A] transition-transform ${showDifficultyDropdown ? 'rotate-180' : ''}`}
                            />
                        </button>

                        {showDifficultyDropdown && (
                            <div className="absolute top-full left-0 mt-1 bg-[#201F1F] rounded-[7px] border border-[#2a2a2a] py-1 z-10 min-w-[100px]">
                                {difficultyOptions.map((option) => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => {
                                            field.onChange(option.value);
                                            setShowDifficultyDropdown(false);
                                        }}
                                        className="w-full px-3 py-1.5 text-left text-[14px] text-[#888] hover:bg-[#2a2a2a] hover:text-white transition-colors flex items-center justify-between"
                                    >
                                        {option.label}
                                        {field.value === option.value && <Check className="w-3 h-3 text-green-500" />}
                                    </button>
                                ))}
                            </div>
                        )}
                    </>
                )}
            />
        </div>
    );
}

