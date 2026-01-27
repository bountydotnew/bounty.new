export function MiniStripeCheckout() {
  return (
    <div className="contain-content w-1/2 h-[628px] flex flex-col justify-between items-start gap-[25px] px-8 py-6 rounded-[30px] bg-white antialiased">
      {/* Drag handle */}
      <div className="w-[147px] h-[13px] rounded-full shrink-0 bg-[#151B2580]" />

      {/* Card number input */}
      <div className="contain-content w-auto h-[52px] rounded-[5px] self-stretch shrink-0 outline outline-1 outline-[#E5E5E5] relative">
        <div className="absolute top-0 left-0 w-[43px] h-[13px] rounded-full bg-[#151B2533]" style={{ translate: '15px 19px' }} />
        <div className="absolute top-0 left-0 w-[131px] h-[13px] rounded-full bg-[#151B2533]" style={{ translate: '96px 19px' }} />
      </div>

      {/* Card details form */}
      <div className="contain-content w-auto h-[207px] rounded-[5px] self-stretch shrink-0 outline outline-1 outline-[#E5E5E5] relative">
        <div className="absolute top-0 left-0 contain-layout flex flex-col justify-between items-start gap-[33px] py-[18px] w-full h-fit">
          {/* First row with radio buttons and card icons */}
          <div className="contain-layout flex justify-between items-center px-[15px] w-auto h-fit self-stretch shrink-0">
            <div className="contain-layout flex items-center gap-4 shrink-0 size-fit">
              <div className="rounded-full shrink-0 bg-[#151B2533] size-4" />
              <div className="w-[67px] h-[13px] rounded-full shrink-0 bg-[#151B2533]" />
            </div>
            <div className="contain-layout flex items-center gap-[5px] shrink-0 size-fit">
              {/* Card brand icons */}
              <div className="contain-content w-[25px] h-[17px] rounded-xs shrink-0 bg-[#242A26] relative">
                <div className="absolute top-0 left-0 contain-content w-[11px] h-[11px] rounded-full bg-[#FFCF00]" style={{ translate: '11px 3px' }} />
                <div className="absolute top-0 left-0 contain-content w-[11px] h-[11px] rounded-full bg-[#DF0916]" style={{ translate: '4px 3px' }} />
              </div>
              <div className="contain-content w-[25px] h-[17px] rounded-xs shrink-0 bg-[#D5D5D5]" />
              <div className="contain-content w-[25px] h-[17px] rounded-xs shrink-0 bg-[#066FD2]" />
              <div className="contain-content w-[25px] h-[17px] opacity-100 shrink-0 bg-[#D5D5D5] relative">
                <div className="absolute top-0 left-0 contain-content w-1 h-2.5 opacity-31 rounded-tl-xs rounded-tr-none rounded-bl-none rounded-br-xs bg-[#7AC050]" style={{ translate: '16px 3px' }} />
                <div className="absolute top-0 left-0 contain-content w-[5px] h-2.5 opacity-31 rounded-tl-xs rounded-tr-none rounded-bl-none rounded-br-xs bg-[#D84F29]" style={{ translate: '10px 3px' }} />
                <div className="absolute top-0 left-0 contain-content w-1 h-2.5 opacity-31 rounded-tl-xs rounded-tr-none rounded-bl-none rounded-br-xs bg-[#238FB4]" style={{ translate: '5px 3px' }} />
              </div>
            </div>
          </div>
          {/* Form fields */}
          <div className="contain-layout flex items-center gap-4 px-[15px] w-auto h-fit self-stretch shrink-0">
            <div className="rounded-full shrink-0 bg-[#151B2533] size-4" />
            <div className="w-[57px] h-[13px] rounded-full shrink-0 bg-[#151B2533]" />
          </div>
          <div className="contain-layout flex items-center gap-4 px-[15px] w-auto h-fit self-stretch shrink-0">
            <div className="rounded-full shrink-0 bg-[#151B2533] size-4" />
            <div className="w-[67px] h-[13px] rounded-full shrink-0 bg-[#151B2533]" />
          </div>
          <div className="contain-layout flex items-center gap-4 px-[15px] w-auto h-fit self-stretch shrink-0">
            <div className="rounded-full shrink-0 bg-[#151B2533] size-4" />
            <div className="w-[82px] h-[13px] rounded-full shrink-0 bg-[#151B2533]" />
          </div>
        </div>
      </div>

      {/* Address form */}
      <div className="contain-content w-auto h-[117px] rounded-[5px] self-stretch shrink-0 outline outline-1 outline-[#E5E5E5] relative">
        <div className="absolute top-0 left-0 rounded-full bg-[#151B2580] size-5" style={{ translate: '13px 12px' }} />
        <div className="absolute top-0 left-0 w-[320px] h-[13px] rounded-full bg-[#151B2533]" style={{ translate: '46px 15px' }} />
        <div className="absolute top-0 left-0 w-[320px] h-2 rounded-full bg-[#151B2533]" style={{ translate: '46px 38px' }} />
        <div className="absolute top-0 left-0 w-[320px] h-2 rounded-full bg-[#151B2533]" style={{ translate: '46px 56px' }} />
      </div>

      {/* Pay button */}
      <div className="contain-layout w-full h-[43px] rounded-full shrink-0 flex justify-center items-center gap-4 bg-black p-4">
        <div className="text-[16px] leading-5 shrink-0 text-white font-semibold size-fit">
          Pay
        </div>
      </div>
    </div>
  );
}
