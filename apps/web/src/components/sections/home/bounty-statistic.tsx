import NumberFlow, { Format } from "@number-flow/react";

interface BountyStatisticProps {
    label: string;
    value: number;
    color: string;
    showDollar?: boolean;
}

export function BountyStatistic({ label, value, color, showDollar = true }: BountyStatisticProps) {

    const format: Format = {
        notation: 'compact',
        compactDisplay: 'short',
        roundingMode: 'trunc',
        style: showDollar ? 'currency' : 'decimal',
        currency: 'USD',
    }
    
    return (
        <div className="bg-transparent p-8 min-w-[200px] relative">
            {/* Corner brackets */}
            <div className="absolute top-0 left-0 w-6 h-6 border-t border-l border-[#282828]"></div>
            <div className="absolute top-0 right-0 w-6 h-6 border-t border-r border-[#282828]"></div>
            <div className="absolute bottom-0 left-0 w-6 h-6 border-b border-l border-[#282828]"></div>
            <div className="absolute bottom-0 right-0 w-6 h-6 border-b border-r border-[#282828]"></div>

            <div className={`text-4xl font-bold mb-2 ${color}`}>
                <NumberFlow respectMotionPreference={true} format={format} value={value} />
            </div>
            <div className="text-gray-400">
                {label}
            </div>
        </div>
    );
}