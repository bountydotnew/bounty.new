export function StripePaymentIcon() {
  // Mini checkout visualization - simplified version of the checkout form
  return (
    <div className="absolute top-[-70px] w-[70px] h-[95px] shrink-0 overflow-hidden rounded-[6px] bg-white p-2">
      {/* Drag handle */}
      <div className="w-[60px] h-[6px] rounded-full bg-surface-1/50 mx-auto mb-1" />
      
      {/* Card number input placeholder */}
      <div className="h-[20px] rounded-[3px] border border-border-default mb-1 flex items-center px-2">
        <div className="w-[20px] h-[6px] rounded-full bg-surface-1/20" />
        <div className="w-[40px] h-[6px] rounded-full bg-surface-1/20 ml-2" />
      </div>
      
      {/* Card details section */}
      <div className="h-[30px] rounded-[3px] border border-border-default mb-1 p-1 flex flex-col gap-1">
        <div className="flex items-center gap-1">
          <div className="w-[8px] h-[8px] rounded-full bg-surface-1/20" />
          <div className="w-[25px] h-[4px] rounded-full bg-surface-1/20" />
        </div>
        <div className="flex items-center gap-1">
          <div className="w-[8px] h-[8px] rounded-full bg-surface-1/20" />
          <div className="w-[20px] h-[4px] rounded-full bg-surface-1/20" />
        </div>
      </div>
      
      {/* Pay button */}
      <div className="h-[12px] rounded-full bg-black flex items-center justify-center">
        <div className="w-[20px] h-[4px] rounded-full bg-white/80" />
      </div>
    </div>
  );
}
