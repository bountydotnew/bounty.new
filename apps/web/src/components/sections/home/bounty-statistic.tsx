import NumberFlow from "@/components/ui/number-flow";

export function BountyStatistic({ label, value }: { label: string, value: number }) {
    return (
        <div className="bg-transparent p-8 min-w-[200px] relative">
            {/* Corner brackets */}
            <div className="absolute top-0 left-0 w-6 h-6 border-t border-l border-[#282828]"></div>
            <div className="absolute top-0 right-0 w-6 h-6 border-t border-r border-[#282828]"></div>
            <div className="absolute bottom-0 left-0 w-6 h-6 border-b border-l border-[#282828]"></div>
            <div className="absolute bottom-0 right-0 w-6 h-6 border-b border-r border-[#282828]"></div>

            <div className="text-4xl font-bold text-green-400 mb-2">$<NumberFlow value={75700} /></div>
            <div className="text-gray-400">{label}</div>
        </div>
    );
}