import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import SubmissionCard from "@/components/bounty/submission-card";
import { useState, useRef, useEffect } from "react";
import { authClient } from "@bounty/auth/client";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { LINKS } from "@/constants/links";
import Bounty from "@/components/icons/bounty";
import Image from "next/image";
import { GithubIcon } from "../icons";
import { Badge } from "@/components/ui/badge";

const cards = {
  ahmet: {
    name: "Ahmet",
    description: "look sir coderabbit says my code good",
    bounty: 100,
    status: "open",
    rank: "Rank 500",
    image: "https://avatars.githubusercontent.com/u/37756565?v=4",
    id: "ahmet",
    screenshot:
      "https://pbs.twimg.com/media/Gwi-mbBWUBc90r_?format=jpg&name=large",
  },
  sergio: {
    name: "Sergio",
    description: "I made ur website use tweakcn now pay me!!",
    bounty: 25,
    status: "open",
    rank: "Rank 0",
    image:
      "https://pbs.twimg.com/profile_images/1939906364119109632/vu8pOSiH_400x400.jpg",
    id: "ahmet",
    screenshot:
      "https://pbs.twimg.com/media/GwjyS7FX0AMIz4H?format=png&name=small",
  },
  nizzy: {
    name: "nizzy",
    description: "Here's my submission",
    bounty: 1000,
    status: "open",
    rank: "Rank 186",
    image:
      "https://pbs.twimg.com/profile_images/1884987569961570304/TP3OWz64_400x400.jpg",
    id: "ahmet",
    screenshot:
      "https://pbs.twimg.com/media/Gwl0qdhWgAAoJdK?format=jpg&name=large",
  },
};

export default function Login() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [loading, setLoading] = useState(false);
  const [lastUsedMethod, setLastUsedMethod] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, isPending } = authClient.useSession();

  // Get callback URL from search params, default to dashboard
  const callbackUrl = searchParams.get("callback") || LINKS.DASHBOARD;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || !svgRef.current) return;

    const svgRect = svgRef.current.getBoundingClientRect();
    const svgCenterX = svgRect.left + svgRect.width / 2;
    const svgCenterY = svgRect.top + svgRect.height / 2;

    const containerRect = containerRef.current.getBoundingClientRect();
    const maxDistance = Math.min(containerRect.width, containerRect.height) / 2;

    const deltaX = e.clientX - svgCenterX;
    const deltaY = e.clientY - svgCenterY;

    const x = deltaX / maxDistance;
    const y = deltaY / maxDistance;

    setMousePosition({
      x: Math.max(-1, Math.min(1, x)),
      y: Math.max(-1, Math.min(1, y)),
    });
  };
  useEffect(() => {
    // Load last used login method from localStorage
    const lastMethod = localStorage.getItem('bounty-last-login-method');
    setLastUsedMethod(lastMethod);

    if (
      !PublicKeyCredential.isConditionalMediationAvailable ||
      !PublicKeyCredential.isConditionalMediationAvailable()
    ) {
      return;
    }

    void authClient.signIn.passkey({ autoFill: true });
  }, []);

  const handleMouseLeave = () => {
    setMousePosition({ x: 0, y: 0 });
  };

  const handleGitHubSignIn = async () => {
    try {
      setLoading(true);
      // Save login method to localStorage
      localStorage.setItem('bounty-last-login-method', 'github');

      await authClient.signIn.social(
        {
          provider: "github",
          callbackURL: callbackUrl,
        },
        {
          onSuccess: () => {
            toast.success("Sign in successful");
          },
          onError: (error) => {
            toast.error(error.error.message || "Sign in failed");
            setLoading(false);
          },
        },
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sign in failed");
      setLoading(false);
    }
  };


  const handleGoToDashboard = () => {
    router.push(callbackUrl);
  };

  // const handlePasskeySignIn = async () => {
  //   try {
  //     // Save login method to localStorage
  //     localStorage.setItem('bounty-last-login-method', 'passkey');

  //     await authClient.signIn.passkey({
  //       autoFill: false,
  //       fetchOptions: {
  //         onSuccess: () => {
  //           toast.success("Signed in successfully");
  //           router.push(callbackUrl);
  //         },
  //       },
  //     });
  //   } catch (error) {
  //     toast.error(error instanceof Error ? error.message : "Sign in failed");
  //   }
  // };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#111110] text-[#f3f3f3]">
      {/* Left Column: Login Section */}
      <div className="flex-1 flex items-center justify-center p-8 md:p-12">
        <div className="max-w-md w-full space-y-8">
          {/* Mobile Bounty Icon 
          <div className="lg:hidden flex justify-center mb-8">
            <Bounty className="w-24 h-28 text-primary" />
          </div>
          */}

          {isPending ? (
            <div className="w-full max-w-96 space-y-8">
              <div className="text-center space-y-4 animate-pulse">
                <div className="w-16 h-16 mx-auto bg-[#383838] rounded-lg"></div>
                <div className="h-7 bg-[#383838] rounded w-48 mx-auto"></div>
              </div>

              <div className="space-y-3 animate-pulse">
                <div className="w-full h-12 bg-[#383838] rounded-lg"></div>
              </div>

              <div className="text-center animate-pulse">
                <div className="h-4 bg-[#383838] rounded w-64 mx-auto"></div>
              </div>
            </div>
          ) : session ? (
            <div className="w-full max-w-96 space-y-8">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-lg flex items-center justify-center">
                  <Bounty className="w-12 h-12 text-primary" />
                </div>
                <div className="space-y-2">
                  <h1 className="flex h-7 items-center justify-center font-medium text-sand-12 text-xl tracking-tight">
                    Welcome back!
                  </h1>
                  <p className="text-sm text-gray-400">
                    You&apos;re already signed in
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-3 bg-[#1D1D1D] rounded-lg">
                  {session.user.image && (
                    <Image
                      src={session.user.image}
                      alt={session.user.name || "User"}
                      className="w-10 h-10 rounded-full"
                      width={40}
                      height={40}
                    />
                  )}
                  <div className="text-left">
                    <p className="text-white font-medium text-sm">
                      {session.user.name}
                    </p>
                    <p className="text-gray-400 text-xs">
                      {session.user.email}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={handleGoToDashboard}
                    className="w-full py-3 bg-[#2A2A28] hover:bg-[#383838] text-gray-200 rounded-lg font-medium transition-colors"
                  >
                    Continue
                  </Button>
                  <Button
                    variant="text"
                    className="w-full py-3 text-gray-400 hover:text-gray-200 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    onClick={() =>
                      authClient.signOut({
                        fetchOptions: {
                          onSuccess: () => {
                            toast.success("Signed out successfully");
                            window.location.href = "/login";
                          },
                        },
                      })
                    }
                  >
                    <LogOut className="w-4 h-4" />
                    Nevermind, log me out.
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full max-w-96 space-y-8">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-lg flex items-center justify-center">
                  <Bounty className="w-12 h-12 text-primary" />
                </div>
                <h1 className="flex h-7 items-center justify-center font-medium text-sand-12 text-xl tracking-tight">Sign in to bounty</h1>
              </div>

              <div className="space-y-3">
                <div className="relative">
                  <Button
                    onClick={handleGitHubSignIn}
                    disabled={loading}
                    className="w-full py-3 bg-[#2A2A28] hover:bg-[#383838] text-gray-200 rounded-lg font-medium transition-colors flex items-center justify-center gap-3"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <GithubIcon className="w-5 h-5 fill-white" />
                    )}
                    {loading ? "Signing in…" : "Continue with GitHub"}
                  </Button>
                  {lastUsedMethod === 'github' && (
                    <Badge className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs px-1 py-0.5">
                      Last used
                    </Badge>
                  )}
                </div>
                {/* <div className="relative flex justify-center pt-2">
                  <Button
                    onClick={handlePasskeySignIn}
                    disabled={loading}
                    variant="text"
                    className="text-gray-400 hover:text-gray-200 flex items-center justify-center gap-2"
                  >
                    <Key className="w-4 h-4" />
                    {loading ? "Signing in…" : "Have a passkey?"}
                  </Button>
                  {lastUsedMethod === 'passkey' && (
                    <Badge className="absolute -top-2 -right-2 bg-green-600 text-white text-xs px-2 py-1">
                      Last used
                    </Badge>
                  )}
                </div> */}
              </div>

              <div className="flex h-8 items-center justify-center text-center text-sm">
                <span className="text-gray-400">Don&apos;t have an account? </span>
                <Link href="/waitlist" className="rounded px-1 py-1 font-medium text-white outline-none transition-colors hover:bg-neutral-800 focus-visible:bg-neutral-800">
                  Join the waitlist
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Showcase Section */}
      <div className="hidden lg:flex flex-1 items-center justify-center">
        <div
          ref={containerRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="flex-1 relative flex items-center justify-center p-8 md:p-12 overflow-hidden min-h-[95%] border-[#383838] border-1 cursor-pointer"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, #383838 1px, transparent 0)",
            backgroundSize: "16px 16px",
            borderRadius: "25px",
            margin: "20px",
            height: "95%",
            backgroundColor: "#1d1d1d",
          }}
        >
          <svg
            ref={svgRef}
            xmlns="http://www.w3.org/2000/svg"
            width="153"
            height="179"
            viewBox="0 0 153 179"
            fill="none"
            className="absolute z-0 transition-transform duration-300 ease-out"
            style={{
              transform: `translate(${mousePosition.x * 8}px, ${mousePosition.y * 8}px)`,
            }}
          >
            <path
              d="M91.1385 71.1097C107.031 77.947 125.457 70.6065 132.294 54.7141C139.132 38.8217 131.791 20.3956 115.899 13.5582C100.006 6.72079 81.5803 14.0613 74.7429 29.9537C67.9055 45.8461 75.2461 64.2723 91.1385 71.1097ZM91.1385 71.1097L29.921 44.7722M5 102.256L33.9985 114.732C49.8909 121.57 68.317 114.229 75.1544 98.3367C81.9918 82.4443 74.6513 64.0182 58.7589 57.1808L29.7603 44.7048M148.655 95.8569L119.657 83.3808C103.764 76.5434 85.338 83.8839 78.5006 99.7763L78.5182 179"
              stroke="url(#paint0_linear_34_3652)"
              strokeWidth="21.3696"
            />
            <defs>
              <linearGradient
                id="paint0_linear_34_3652"
                x1="35.4019"
                y1="-16.1847"
                x2="150.598"
                y2="205.685"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#8D8D8D" />
                <stop offset="1" stopColor="#E6E6E6" />
              </linearGradient>
            </defs>
          </svg>

          {/* top left */}
          <div
            className="absolute -rotate-[22deg] top-[30%] left-[0%] transform -translate-x-1/2 -translate-y-1/2 z-10 transition-transform duration-300 ease-out"
            style={{
              transform: `translate(${-mousePosition.x * 25}px, ${-mousePosition.y * 25}px) rotate(-22deg)`,
            }}
          >
            <SubmissionCard
              user="Adam"
              rank="Rank 1000"
              description="look sir coderabbit shows the code is good"
              avatarSrc="/public/images/grim-avatar.jpg"
              previewSrc="https://i.redd.it/slm52i26jbtb1.jpg"
              hasBadge={true}
            />
          </div>

          {/* bottom right */}
          <div
            className="absolute -rotate-[22deg] bottom-[25%] right-[5%] transform translate-x-1/2 translate-y-1/2 z-10 transition-transform duration-300 ease-out"
            style={{
              transform: `translate(${-mousePosition.x * 30}px, ${-mousePosition.y * 30}px) rotate(-22deg)`,
            }}
          >
            <SubmissionCard
              user={cards.sergio.name}
              rank={cards.sergio.rank}
              description="I one shotted this with v0"
              avatarSrc={cards.sergio.image}
              previewSrc={cards.sergio.screenshot}
              hasBadge={false}
            />
          </div>

          {/* bottom left */}
          <div
            className="absolute rotate-[22deg] bottom-[25%] left-[0%] transform -translate-x-1/2 translate-y-1/2 z-10 transition-transform duration-300 ease-out"
            style={{
              transform: `translate(${-mousePosition.x * 20}px, ${-mousePosition.y * 20}px) rotate(22deg)`,
            }}
          >
            <SubmissionCard
              user="Ahmet"
              rank="New user"
              description="Here is my try"
              avatarSrc="https://avatars.githubusercontent.com/u/37756565?v=4"
              previewSrc="https://i.redd.it/slm52i26jbtb1.jpg"
            />
          </div>

          {/* top right */}
          <div
            className="absolute rotate-[22deg] top-[30%] right-[0%] transform translate-x-1/2 -translate-y-1/2 z-10 transition-transform duration-300 ease-out"
            style={{
              transform: `translate(${-mousePosition.x * 28}px, ${-mousePosition.y * 28}px) rotate(22deg)`,
            }}
          >
            <SubmissionCard
              user={cards.ahmet.name}
              rank={cards.ahmet.rank}
              description={cards.ahmet.description}
              avatarSrc={cards.ahmet.image}
              previewSrc={cards.ahmet.screenshot}
              hasBadge={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
