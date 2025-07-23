import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Github } from "lucide-react"
import BountyCard from "@/components/bounty/card"
import { useState, useEffect, useRef } from "react"
import { authClient } from "@/lib/auth-client"
import { toast } from "sonner"
import { baseUrl } from "@/lib/constants"
import { useRouter } from "next/navigation"

export default function Component() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const x = (e.clientX - rect.left - centerX) / centerX;
    const y = (e.clientY - rect.top - centerY) / centerY;

    setMousePosition({ x, y });
  };

  const handleMouseLeave = () => {
    setMousePosition({ x: 0, y: 0 });
  };

  const handleGitHubSignIn = async () => {
    try {
      const callbackURL = `${baseUrl}/dashboard`;

      await authClient.signIn.social(
        {
          provider: "github",
          callbackURL
        },
        {
          onSuccess: () => {
            toast.success("Sign in successful");
          },
          onError: (error) => {
            toast.error(error.error.message || "Sign in failed");
          },
        }
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sign in failed");
    }
  };

  const handleGoogleSignIn = () => {
    toast.info("Google sign-in coming soon!");
  };

  const handleEmailSignIn = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    toast.info("Email sign-in coming soon!");
  };

  const handleResetPassword = () => {
    toast.info("Password reset coming soon!");
  };

  const handleGoToDashboard = () => {
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#252525] border border-[#B3B3B3] text-[#f3f3f3]">
      {/* Left Column: Login Section */}
      <div className="flex-1 flex items-center justify-center p-8 md:p-12">
        <div className="max-w-md w-full space-y-8">
          {isPending ? (
            <div className="text-center space-y-4">
              <div className="animate-pulse">
                <div className="h-12 bg-[#383838] rounded mb-4"></div>
                <div className="h-4 bg-[#383838] rounded mb-2"></div>
                <div className="h-4 bg-[#383838] rounded w-3/4 mx-auto"></div>
              </div>
            </div>
          ) : session ? (
            <div className="text-center space-y-6">
              <div className="space-y-2">
                <h1 className="text-4xl md:text-5xl font-bold">Welcome back!</h1>
                <p className="text-lg text-[#757575]">You're already signed in</p>
              </div>
              <div className="bg-[#1D1D1D] rounded-xl p-6 md:p-8 space-y-4 shadow-[0px_23px_38.1px_-5px_rgba(12,12,13,0.10)]">
                <div className="flex flex-col items-center space-y-4">
                  <div className="flex items-center space-x-3">
                    {session.user.image && (
                      <img
                        src={session.user.image}
                        alt={session.user.name || "User"}
                        className="w-12 h-12 rounded-full border-2 border-[#383838]"
                      />
                    )}
                    <div className="text-left">
                      <p className="text-[#f3f3f3] font-medium">{session.user.name}</p>
                      <p className="text-[#757575] text-sm">{session.user.email}</p>
                    </div>
                  </div>
                  <Button
                    onClick={handleGoToDashboard}
                    className="oauthButton w-full max-w-[466px] min-w-[240px] h-12 px-6 py-3 bg-[#303030] text-[#f3f3f3] rounded-lg flex items-center justify-center gap-3 shadow-button-custom"
                  >
                    Go to Dashboard
                  </Button>
                  <Button
                    onClick={() => authClient.signOut({ fetchOptions: { onSuccess: () => { toast.success("Signed out successfully"); } } })}
                    className="oauthButton w-full max-w-[466px] min-w-[240px] h-12 px-6 py-3 bg-[#303030] text-[#f3f3f3] rounded-lg flex items-center justify-center gap-3 shadow-button-custom hover:bg-[#383838]"
                  >
                    Sign Out
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="text-center space-y-2">
                <h1 className="text-4xl md:text-5xl font-bold">Get started</h1>
                <p className="text-lg text-[#757575]">Sign in to your account</p>
              </div>
              <div className="bg-[#1D1D1D] rounded-xl p-6 md:p-8 space-y-4 shadow-[0px_23px_38.1px_-5px_rgba(12,12,13,0.10)]">
                <Button
                  onClick={handleGitHubSignIn}
                  className="oauthButton w-full max-w-[466px] min-w-[240px] h-12 px-6 py-3 bg-[#303030] text-[#f3f3f3] rounded-lg flex items-center justify-center gap-3 shadow-button-custom hover:bg-[#383838]"
                >
                  <Github className="w-5 h-5" />
                  Continue with GitHub
                </Button>
                <Button
                  onClick={handleGoogleSignIn}
                  className="oauthButton w-full max-w-[466px] min-w-[240px] h-12 px-6 py-3 bg-[#303030] text-[#f3f3f3] rounded-lg flex items-center justify-center gap-3 shadow-button-custom hover:bg-[#383838]"
                >
                  <span className="text-xl font-bold">G</span>
                  Continue with Google
                </Button>
                <p className="text-center text-sm text-[#757575] mt-8 ">
                  {"By continuing, you accept our "}
                  <Link href="#" className="underline text-[#b3b3b3] hover:text-[#f3f3f3]">
                    Terms of Service
                  </Link>
                  {" and "}
                  <Link href="#" className="underline text-[#b3b3b3] hover:text-[#f3f3f3]">
                    Privacy Policy
                  </Link>
                  .
                </p>
              </div>
            </>
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
            backgroundImage: "radial-gradient(circle at 1px 1px, #383838 1px, transparent 0)",
            backgroundSize: "16px 16px",
            borderRadius: "25px",
            margin: "20px",
            height: "95%",
            backgroundColor: "#1d1d1d",
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="153"
            height="179"
            viewBox="0 0 153 179"
            fill="none"
            className="absolute z-0 transition-transform duration-300 ease-out"
            style={{
              transform: `translate(${mousePosition.x * 1}px, ${mousePosition.y * 1}px)`
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
              transform: `translate(${-mousePosition.x * 3}px, ${-mousePosition.y * 3}px) rotate(-22deg)`
            }}
          >
            <BountyCard
              user="F1shy"
              rank="Rank 5"
              description="Hello sir pls look at my submission"
              avatarSrc="/public/images/grim-avatar.jpg"
              previewSrc="https://i.redd.it/slm52i26jbtb1.jpg"
              hasBadge={true}
            />
          </div>

          {/* bottom right */}
          <div
            className="absolute -rotate-[22deg] bottom-[25%] right-[5%] transform translate-x-1/2 translate-y-1/2 z-10 transition-transform duration-300 ease-out"
            style={{
              transform: `translate(${-mousePosition.x * 5}px, ${-mousePosition.y * 5}px) rotate(-22deg)`
            }}
          >
            <BountyCard
              user="Sergio"
              rank="Rank 2"
              description="I one shotted this with v0"
              avatarSrc="https://preview.redd.it/buff-shrek-v0-9ggsitun5d9a1.png?auto=webp&s=1753870ab37e1d71330bfefe331c3dde281f8bcc"
              previewSrc="https://i.redd.it/slm52i26jbtb1.jpg"
              hasBadge={true}
            />
          </div>

          {/* bottom left */}
          <div
            className="absolute rotate-[22deg] bottom-[25%] left-[0%] transform -translate-x-1/2 translate-y-1/2 z-10 transition-transform duration-300 ease-out"
            style={{
              transform: `translate(${-mousePosition.x * 2}px, ${-mousePosition.y * 2}px) rotate(22deg)`
            }}
          >
            <BountyCard
              user="Ahmet"
              rank="New user"
              description="Here is my try"
              avatarSrc="https://preview.redd.it/buff-shrek-v0-9ggsitun5d9a1.png?auto=webp&s=1753870ab37e1d71330bfefe331c3dde281f8bcc"
              previewSrc="https://i.redd.it/slm52i26jbtb1.jpg"
            />
          </div>

          {/* top right */}
          <div
            className="absolute rotate-[22deg] top-[30%] right-[0%] transform translate-x-1/2 -translate-y-1/2 z-10 transition-transform duration-300 ease-out"
            style={{
              transform: `translate(${-mousePosition.x * 4}px, ${-mousePosition.y * 4}px) rotate(22deg)`
            }}
          >
            <BountyCard
              user="F1shy"
              rank="Rank 5"
              description="There, fatty. I added color theming to ur app."
              avatarSrc="https://preview.redd.it/buff-shrek-v0-9ggsitun5d9a1.png?auto=webp&s=1753870ab37e1d71330bfefe331c3dde281f8bcc"
              previewSrc="https://i.redd.it/slm52i26jbtb1.jpg"
              hasBadge={true}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
