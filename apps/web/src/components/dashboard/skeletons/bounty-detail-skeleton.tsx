export function BountyDetailSkeleton() {
  return (
    <div className="min-h-screen bg-[#111110] text-white animate-pulse pt-16">
      <div className="mx-auto max-w-[90%]">
        <div className="mb-4 flex w-full items-center justify-between">
          <div className="flex w-full items-center justify-between gap-2">
            <div className="h-6 w-32 rounded bg-[#383838]/20" />
            <div className="h-8 w-24 rounded bg-[#383838]/20" />
          </div>
        </div>

        <div className="flex flex-col gap-8 xl:flex-row">
          <div className="flex-1 p-8 xl:flex-[2]">
            <div className="mb-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="h-10 w-3/4 rounded bg-[#383838]/20" />
                <div className="h-8 w-24 rounded bg-[#383838]/20" />
              </div>

              <div className="flex w-full flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-[#383838]/20" />
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-20 rounded bg-[#383838]/20" />
                      <div className="h-4 w-4 rounded bg-[#383838]/20" />
                    </div>
                    <div className="h-3 w-16 rounded bg-[#383838]/20" />
                  </div>
                </div>

                <div className="flex w-full items-center justify-end gap-2">
                  <div className="h-8 w-8 rounded bg-[#383838]/20" />
                  <div className="h-8 w-8 rounded bg-[#383838]/20" />
                  <div className="h-8 w-8 rounded bg-[#383838]/20" />
                  <div className="h-8 w-8 rounded bg-[#383838]/20" />
                </div>
              </div>
            </div>

            <div className="mb-8 rounded-lg border border-[#383838]/20 bg-[#1D1D1D] p-6">
              <div className="h-6 w-16 rounded bg-[#383838]/20 mb-4" />
              <div className="space-y-3">
                <div className="h-4 w-full rounded bg-[#383838]/20" />
                <div className="h-4 w-5/6 rounded bg-[#383838]/20" />
                <div className="h-4 w-4/5 rounded bg-[#383838]/20" />
                <div className="h-4 w-3/4 rounded bg-[#383838]/20" />
              </div>
            </div>

            <div className="space-y-4">
              <div className="h-6 w-24 rounded bg-[#383838]/20" />
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-4 rounded-lg border border-[#383838]/20 bg-[#1D1D1D]">
                  <div className="h-8 w-8 rounded-full bg-[#383838]/20" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-20 rounded bg-[#383838]/20" />
                    <div className="h-4 w-full rounded bg-[#383838]/20" />
                    <div className="h-4 w-3/4 rounded bg-[#383838]/20" />
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-lg border border-[#383838]/20 bg-[#1D1D1D]">
                  <div className="h-8 w-8 rounded-full bg-[#383838]/20" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-20 rounded bg-[#383838]/20" />
                    <div className="h-4 w-full rounded bg-[#383838]/20" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="hidden xl:block xl:w-[480px] xl:flex-shrink-0">
            <div className="sticky top-0 xl:h-[calc(100vh-8rem)] xl:overflow-y-auto xl:pr-2">
              <div className="mb-6 flex items-center justify-between">
                <div className="h-6 w-24 rounded bg-[#383838]/20" />
                <div className="h-10 w-32 rounded bg-[#383838]/20" />
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-lg border border-[#383838]/20 bg-[#1D1D1D]">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="h-10 w-10 rounded-full bg-[#383838]/20" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="h-4 w-16 rounded bg-[#383838]/20" />
                        <div className="h-4 w-4 rounded bg-[#383838]/20" />
                      </div>
                      <div className="h-3 w-12 rounded bg-[#383838]/20" />
                    </div>
                  </div>
                  <div className="h-20 w-20 rounded bg-[#383838]/20 mb-3" />
                  <div className="space-y-2">
                    <div className="h-3 w-full rounded bg-[#383838]/20" />
                    <div className="h-3 w-3/4 rounded bg-[#383838]/20" />
                  </div>
                </div>

                <div className="p-4 rounded-lg border border-[#383838]/20 bg-[#1D1D1D]">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="h-10 w-10 rounded-full bg-[#383838]/20" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="h-4 w-16 rounded bg-[#383838]/20" />
                        <div className="h-4 w-4 rounded bg-[#383838]/20" />
                      </div>
                      <div className="h-3 w-12 rounded bg-[#383838]/20" />
                    </div>
                  </div>
                  <div className="h-20 w-20 rounded bg-[#383838]/20 mb-3" />
                  <div className="space-y-2">
                    <div className="h-3 w-full rounded bg-[#383838]/20" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
