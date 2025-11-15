'use client';

import { authClient } from '@bounty/auth/client';
import { useBountyModals } from '@bounty/ui/lib/bounty-utils';
import { track } from '@databuddy/sdk';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import { AccessGate } from '@/components/access-gate';
import { BountiesFeed } from '@/components/bounty/bounties-feed';
import { CreateBountyModal } from '@/components/bounty/create-bounty-modal';
import GithubImportModal from '@/components/bounty/github-import-modal';
import { BetaAccessScreen } from '@/components/dashboard/beta-access-screen';
// Dashboard components
import { ErrorBoundary } from '@/components/dashboard/error-boundary';
import { DashboardPageSkeleton } from '@/components/dashboard/skeletons/dashboard-page-skeleton';
import { useDevice } from '@/components/device-provider';
import { Header } from '@/components/dual-sidebar/sidebar-header';
import { Onboarding } from '@/components/onboarding';
import { ChevronDown } from 'lucide-react';
import { GithubIcon, DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, ArrowDownIcon2 } from '@bounty/ui';
// Constants and types
import { PAGINATION_DEFAULTS, PAGINATION_LIMITS } from '@/constants';
import { trpc } from '@/utils/trpc';

track('screen_view', { screen_name: 'dashboard' });

export default function Dashboard() {
  // Memoized query options for better performance
  const bountiesQuery = useMemo(
    () =>
      trpc.bounties.fetchAllBounties.queryOptions({
        page: PAGINATION_DEFAULTS.PAGE,
        limit: PAGINATION_LIMITS.ALL_BOUNTIES,
      }),
    []
  );

  const myBountiesQuery = useMemo(
    () =>
      trpc.bounties.fetchMyBounties.queryOptions({
        page: PAGINATION_DEFAULTS.PAGE,
        limit: PAGINATION_LIMITS.MY_BOUNTIES,
      }),
    []
  );

  const existingSubmissionQuery = useMemo(
    () => trpc.betaApplications.checkExisting.queryOptions(),
    []
  );

  const userDataQuery = useMemo(() => trpc.user.getMe.queryOptions(), []);

  // Queries
  const bounties = useQuery(bountiesQuery);
  const myBounties = useQuery(myBountiesQuery);
  const existingSubmission = useQuery(existingSubmissionQuery);
  const userData = useQuery(userDataQuery);

  const { data: session } = authClient.useSession();
  const { isMobile } = useDevice();
  const { createModalOpen, closeCreateModal } = useBountyModals();
  const [importOpen, setImportOpen] = useState(false);

  // Memoized handlers
  // const handleBountyClick = useCallback(
  //   (bounty: Bounty) => {
  //     router.push(`/bounty/${bounty.id}?from=dashboard`);
  //   },
  //   [router],
  // );

  const handleSubmissionRefetch = useCallback(() => {
    existingSubmission.refetch();
  }, [existingSubmission]);

  // Loading state for critical data
  // const isInitialLoading =
  //   bounties.isLoading || myBounties.isLoading || userData.isLoading;

  // if (isInitialLoading) {
  //   return (
  //     <div className="flex justify-center items-center h-screen">
  //       <Spinner />
  //     </div>
  //   );
  // }

  return (
    <ErrorBoundary>
      <AccessGate
        fallback={
          <BetaAccessScreen
            existingSubmission={existingSubmission.data}
            isMobile={isMobile}
            onSubmissionRefetch={handleSubmissionRefetch}
            sessionUserName={session?.user.name}
            userData={userData.data}
          />
        }
        skeleton={<DashboardPageSkeleton />}
        stage="beta"
      >
        <Onboarding />
        <Header
          isMyBountiesLoading={myBounties.isLoading}
          myBounties={myBounties.data?.data ?? []}
        />

        <div className="flex min-h-[calc(100vh-72px)] flex-col bg-background">
          {/* Horizontal border line above textarea */}
          <div className="h-px w-full shrink-0 bg-[#232323]" />

          {/* Textarea section - centered with margins */}
          <div className="flex w-full shrink-0 flex-col px-4 lg:max-w-[805px] xl:px-0 mx-auto">
            <form className="w-full flex flex-col mt-10 mb-6">
              <fieldset className="w-full [all:unset]">
                <div
                  role="presentation"
                  className="bg-[#191919] text-[#5A5A5A] border-[1.5px] border-[#232323] rounded-2xl relative focus-within:shadow-[0_0_0_2px_rgba(59,130,246,0.5)] focus-within:outline-none transition-colors cursor-text overflow-hidden"
                >
                  {/* Hidden file input */}
                  <input
                    accept="image/*,.jpeg,.jpg,.png,.webp,.svg"
                    multiple
                    tabIndex={-1}
                    type="file"
                    className="absolute border-0 clip-[rect(0px,0px,0px,0px)] h-px m-0 overflow-hidden p-0 w-px whitespace-nowrap"
                  />

                  <div className="flex flex-col">
                    <div className="flex flex-col h-full">
                      <div className="flex flex-col overflow-x-hidden min-w-0">
                        {/* Textarea area */}
                        <textarea
                          className="flex flex-col text-base h-full border-none p-3.5 min-h-[120px] max-h-[400px] resize-none shadow-none focus:ring-0 focus:outline-none w-full overflow-x-hidden overflow-y-auto bg-transparent text-[#5A5A5A] placeholder:text-[#5A5A5A]"
                          placeholder="Plan a new task for Tembo to handle..."
                          rows={4}
                        />
                      </div>
                    </div>

                    {/* Bottom controls */}
                    <div className="px-3 pb-3 flex justify-between items-center gap-2 flex-row min-w-0 bg-transparent">
                      {/* Left side - Repository/Branch/AI buttons */}
                      <div className="flex-wrap flex items-center gap-1 min-w-0">
                        {/* GitHub repo button */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              className="w-fit text-sm font-medium inline-flex items-center justify-center gap-0.5 whitespace-nowrap relative focus:outline-none focus-visible:shadow-[0_0_0_2px_rgba(59,130,246,0.5)] disabled:text-[#5A5A5A] disabled:shadow-none text-[#CFCFCF] bg-[#0F0F0F] hover:bg-[#141414] active:bg-[#1A1A1A] h-[28px] px-[6px] py-[4px] rounded-full overflow-hidden max-w-[200px] sm:max-w-none"
                              type="button"
                            >
                              <GithubIcon className="w-5 h-5 shrink-0" />
                              <div className="hidden sm:flex gap-0.5 text-sm font-medium items-center overflow-hidden">
                                <span className="truncate">bounty.new</span>
                              </div>
                              <ChevronDown className="w-3.5 h-3.5 ml-auto shrink-0 text-[#5A5A5A]" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-60 p-0 border-[#232323] bg-[#191919] text-[#CFCFCF] rounded-xl shadow-[rgba(0,0,0,0.08)_0px_16px_40px_0px]" align="start" side="bottom">
                            <div className="p-1">
                              <div className="flex items-center border-b border-[#232323] px-2 font-medium">
                                <input
                                  className="flex h-7 w-full rounded-md bg-transparent py-3 text-sm outline-none focus:outline-none focus:ring-0 focus-visible:ring-0 placeholder:text-[#5A5A5A] disabled:cursor-not-allowed disabled:opacity-50"
                                  placeholder="Search repositories"
                                  autoComplete="off"
                                  autoCorrect="off"
                                  spellCheck={false}
                                />
                              </div>
                              <DropdownMenuSeparator className="h-px bg-[#232323] my-1 -mx-1" />
                              <div className="overflow-x-hidden flex flex-col max-h-[180px] overflow-y-auto no-scrollbar">
                                <DropdownMenuItem className="relative cursor-default select-none py-1.5 outline-none data-[disabled=true]:pointer-events-none data-[selected=true]:text-[#CFCFCF] data-[disabled=true]:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 flex items-center gap-2 w-full h-8 px-2 rounded-lg data-[selected=true]:bg-[#141414] text-sm font-medium hover:bg-[#141414] focus:bg-[#141414] bg-transparent">
                                  <GithubIcon className="size-4 text-[#5A5A5A]" />
                                  <span className="text-[#CFCFCF] truncate block overflow-hidden">bounty.new</span>
                                </DropdownMenuItem>
                              </div>
                            </div>
                          </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Branch button */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              className="w-fit text-sm font-medium inline-flex items-center justify-center gap-0.5 whitespace-nowrap relative focus:outline-none focus-visible:shadow-[0_0_0_2px_rgba(59,130,246,0.5)] disabled:text-[#5A5A5A] disabled:shadow-none text-[#CFCFCF] bg-[#0F0F0F] hover:bg-[#141414] active:bg-[#1A1A1A] h-[28px] px-[6px] py-[4px] rounded-full max-w-[150px] sm:max-w-none"
                              type="button"
                            >
                              <div className="hidden sm:flex gap-0.5 items-center overflow-hidden">
                                <span className="truncate text-[#CFCFCF]">main</span>
                                <ChevronDown className="w-3.5 h-3.5 shrink-0 text-[#5A5A5A]" />
                              </div>
                              <ChevronDown className="sm:hidden w-3.5 h-3.5 shrink-0 text-[#5A5A5A]" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-60 p-0 border-[#232323] bg-[#191919] text-[#CFCFCF] rounded-xl shadow-[rgba(0,0,0,0.08)_0px_16px_40px_0px]" align="start" side="bottom">
                            <div className="p-1">
                              <div className="flex items-center border-b border-[#232323] px-2 font-medium">
                                <input
                                  className="flex h-7 w-full rounded-md bg-transparent py-3 text-sm outline-none focus:outline-none focus:ring-0 focus-visible:ring-0 placeholder:text-[#5A5A5A] disabled:cursor-not-allowed disabled:opacity-50"
                                  placeholder="Search branches"
                                  autoComplete="off"
                                  autoCorrect="off"
                                  spellCheck={false}
                                />
                              </div>
                              <DropdownMenuSeparator className="h-px bg-[#232323] my-1 -mx-1" />
                              <div className="overflow-x-hidden flex flex-col max-h-[180px] overflow-y-auto no-scrollbar">
                                {['main', 'develop', 'feature/new-ui', 'hotfix/auth-fix'].map((branch) => (
                                  <DropdownMenuItem
                                    key={branch}
                                    className="relative cursor-default select-none py-1.5 outline-none data-[disabled=true]:pointer-events-none data-[selected=true]:text-[#CFCFCF] data-[disabled=true]:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 flex items-center gap-2 w-full h-8 px-2 rounded-lg data-[selected=true]:bg-[#141414] text-sm font-medium hover:bg-[#141414] focus:bg-[#141414] bg-transparent"
                                  >
                                    <GithubIcon className="size-4 text-[#5A5A5A]" />
                                    <span className="text-[#CFCFCF] truncate block overflow-hidden">{branch}</span>
                                  </DropdownMenuItem>
                                ))}
                              </div>
                            </div>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Right side - Action buttons */}
                      <div className="flex gap-2 justify-between items-center shrink-0">
                        <button
                          className="text-sm font-medium inline-flex items-center justify-center gap-0.5 whitespace-nowrap relative focus:outline-none focus-visible:shadow-[0_0_0_2px_rgba(59,130,246,0.5)] disabled:text-[#5A5A5A] disabled:shadow-none text-white bg-[#0F0F0F] hover:bg-[#141414] active:bg-[#1A1A1A] px-[6px] py-[4px] w-[50px] h-[40px] rounded-full shadow-[0_0_0_1px_rgba(0,0,0,0.22),0_-1px_2px_0_rgba(255,255,255,0.12)_inset,0_1px_2px_0_rgba(255,255,255,0.16)_inset]"
                          type="submit"
                        >
                          <ArrowDownIcon2 className="w-5 h-5 text-white/80 rotate-90" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </fieldset>
            </form>
          </div>

          {/* Horizontal border line below textarea */}
          <div className="h-px w-full shrink-0 bg-[#232323]" />

          {/* Bounty list section with vertical borders */}
          <div className="flex flex-1 shrink-0 flex-col w-full overflow-hidden lg:max-w-[805px] xl:px-0 xl:border-x border-[#232323] mx-auto py-4">
            <div className="flex-1 overflow-y-auto">
              <div className="relative flex flex-col pb-10 px-4 w-full">
                <BountiesFeed
                  bounties={bounties.data?.data ?? []}
                  className="lg:pr-2"
                  error={
                    bounties.error instanceof Error
                      ? bounties.error
                      : undefined
                  }
                  isError={bounties.isError}
                  isLoading={bounties.isLoading}
                  layout="list"
                />
              </div>
            </div>
          </div>
        </div>
        {/* <FloatingCreateMenu
          disabled={!session?.user}
          onCreate={() => openCreateModal()}
          onImport={() => setImportOpen(true)}
        /> */}
        <CreateBountyModal
          onOpenChange={closeCreateModal}
          open={createModalOpen}
        />
        <GithubImportModal onOpenChange={setImportOpen} open={importOpen} />
      </AccessGate>
    </ErrorBoundary>
  );
}
