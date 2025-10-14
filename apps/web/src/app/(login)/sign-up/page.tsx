'use client';

import { authClient } from '@bounty/auth/client';
import { Badge } from '@bounty/ui/components/badge';
import { Button } from '@bounty/ui/components/button';
import { Spinner } from '@bounty/ui/components/spinner';
import { Input } from '@bounty/ui/components/input';
import { Label } from '@bounty/ui/components/label';
import { Suspense, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import SubmissionCard from '@/components/bounty/submission-card';
import Bounty from '@/components/icons/bounty';
import { GithubIcon } from '@/components/icons';
import { LINKS } from '@/constants';

const cards = {
  ahmet: {
    name: 'Ahmet',
    description: 'look sir coderabbit says my code good',
    bounty: 100,
    status: 'open',
    rank: 'Rank 500',
    image: 'https://avatars.githubusercontent.com/u/37756565?v=4',
    id: 'ahmet',
    screenshot: 'https://pbs.twimg.com/media/Gwi-mbBWUBc90r_?format=jpg&name=large',
  },
  sergio: {
    name: 'Sergio',
    description: 'I made ur website use tweakcn now pay me!!',
    bounty: 25,
    status: 'open',
    rank: 'Rank 0',
    image:
      'https://pbs.twimg.com/profile_images/1939906364119109632/vu8pOSiH_400x400.jpg',
    id: 'sergio',
    screenshot: 'https://pbs.twimg.com/media/GwjyS7FX0AMIz4H?format=png&name=small',
  },
  nizzy: {
    name: 'nizzy',
    description: "Here's my submission",
    bounty: 1000,
    status: 'open',
    rank: 'Rank 186',
    image:
      'https://pbs.twimg.com/profile_images/1884987569961570304/TP3OWz64_400x400.jpg',
    id: 'nizzy',
    screenshot: 'https://pbs.twimg.com/media/Gwl0qdhWgAAoJdK?format=jpg&name=large',
  },
};

function SignUpContent() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPending, startTransition] = useTransition();

  const router = useRouter();

  const handleSignUp = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!email) {
      toast.error('Please fill in all fields');
      return;
    }
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    if (!password) {
      toast.error('Please fill in all fields');
      return;
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }
    
    startTransition(async () => {
      const name = `${firstName} ${lastName}`.trim();
      
      await authClient.signUp.email({
        email,
        password,
        name: name || email.split('@')[0],
        fetchOptions: {
          onError: (ctx) => {
            toast.error(ctx.error.message);
          },
          onSuccess: async () => {
            // Trigger OTP send after successful sign-up
            // Use 'sign-in' type to auto-sign-in after verification
            try {
              await authClient.emailOtp.sendVerificationOtp({
                email,
                type: 'sign-in',
              });
              
              toast.success('Account created! Please check your email to sign in.');
              router.push(`/sign-up/verify-email-address?email=${encodeURIComponent(email)}`);
            } catch (error) {
              toast.error('Failed to send verification code. Please try again.');
           } catch (error) {
             toast.error('Failed to send verification code. Please try again.');
           }
         },
       },
            }
          },
        },
      });
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!(containerRef.current && svgRef.current)) {
      return;
    }

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

  const handleMouseLeave = () => {
    setMousePosition({ x: 0, y: 0 });
  };

  const handleGitHubSignIn = async () => {
    await authClient.signIn.social(
      {
        provider: "github",
        callbackURL: LINKS.DASHBOARD,
      },
      {
        onSuccess: () => {
          toast.success("Sign in successful");
        },
        onError: (error) => {
          toast.error(error.error.message || "Sign in failed");
        },
      },
    );
  };

  const lastMethod = authClient.getLastUsedLoginMethod();

  return (
    <div className="flex min-h-screen flex-col bg-[#111110] text-[#f3f3f3] md:flex-row">
      {/* Left Column: Sign-Up Section */}
      <div className="flex flex-1 items-center justify-center p-8 md:p-12">
        <div className="w-full max-w-96 space-y-8">
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-lg">
              <Bounty className="h-12 w-12 text-primary" />
            </div>
            <h1 className="flex h-7 items-center justify-center font-medium text-sand-12 text-xl tracking-tight">
              Create your bounty account
            </h1>
          </div>

          <div className="space-y-6">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first-name">First name</Label>
                  <Input
                    id="first-name"
                    placeholder="Ada"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    disabled={isPending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last-name">Last name</Label>
                  <Input
                    id="last-name"
                    placeholder="Lovelace"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    disabled={isPending}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isPending}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isPending}
                  required
                />
              </div>
              <Button
                className="w-full"
                disabled={isPending}
                onClick={handleSignUp}
              >
                {isPending ? 'Creating account…' : 'Create an account'}
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-600" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#111110] px-2 text-gray-400">Or continue with</span>
              </div>
            </div>

            <div className="relative">
              <Button
                className="flex w-full items-center justify-center gap-3 rounded-lg bg-[#2A2A28] py-3 font-medium text-gray-200 transition-colors hover:bg-[#383838]"
                onClick={handleGitHubSignIn}
              >
                <GithubIcon className="h-5 w-5 fill-white" />
                Continue with GitHub
              </Button>
              {lastMethod === 'github' && (
                <Badge className="-top-2 -right-2 absolute bg-primary px-1 py-0.5 text-primary-foreground text-xs">
                  Last used
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Showcase Section (cloned from login) */}
      <div className="hidden flex-1 items-center justify-center lg:flex">
        {/* decorative canvas */}
        <div
          className="relative flex min-h-[95%] flex-1 cursor-pointer items-center justify-center overflow-hidden border-1 border-[#383838] p-8 md:p-12"
          onMouseLeave={handleMouseLeave}
          onMouseMove={handleMouseMove}
          ref={containerRef}
          aria-hidden="true"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, #383838 1px, transparent 0)',
            backgroundSize: '16px 16px',
            borderRadius: '25px',
            margin: '20px',
            height: '95%',
            backgroundColor: '#1d1d1d',
          }}
        >
          <svg
            className="absolute z-0 transition-transform duration-300 ease-out"
            fill="none"
            height="179"
            ref={svgRef}
            style={{
              transform: `translate(${mousePosition.x * 8}px, ${mousePosition.y * 8}px)`,
            }}
            viewBox="0 0 153 179"
            width="153"
            xmlns="http://www.w3.org/2000/svg"
          >
            <title>Decorative bounty graphic</title>
            <path
              d="M91.1385 71.1097C107.031 77.947 125.457 70.6065 132.294 54.7141C139.132 38.8217 131.791 20.3956 115.899 13.5582C100.006 6.72079 81.5803 14.0613 74.7429 29.9537C67.9055 45.8461 75.2461 64.2723 91.1385 71.1097ZM91.1385 71.1097L29.921 44.7722M5 102.256L33.9985 114.732C49.8909 121.57 68.317 114.229 75.1544 98.3367C81.9918 82.4443 74.6513 64.0182 58.7589 57.1808L29.7603 44.7048M148.655 95.8569L119.657 83.3808C103.764 76.5434 85.338 83.8839 78.5006 99.7763L78.5182 179"
              stroke="url(#paint0_linear_34_3652)"
              strokeWidth="21.3696"
            />
            <defs>
              <linearGradient
                gradientUnits="userSpaceOnUse"
                id="paint0_linear_34_3652"
                x1="35.4019"
                x2="150.598"
                y1="-16.1847"
                y2="205.685"
              >
                <stop stopColor="#8D8D8D" />
                <stop offset="1" stopColor="#E6E6E6" />
              </linearGradient>
            </defs>
          </svg>

          {/* top left */}
          <div
            className="-rotate-[22deg] -translate-x-1/2 -translate-y-1/2 absolute top-[30%] left-[0%] z-10 transform transition-transform duration-300 ease-out"
            style={{
              transform: `translate(${-mousePosition.x * 25}px, ${-mousePosition.y * 25}px) rotate(-22deg)`,
            }}
          >
            <SubmissionCard
           <SubmissionCard
            avatarSrc="/images/grim-avatar.jpg"
             description="look sir coderabbit shows the code is good"
             hasBadge={true}
             previewSrc="https://i.redd.it/slm52i26jbtb1.jpg"
              description="look sir coderabbit shows the code is good"
              hasBadge={true}
              previewSrc="https://i.redd.it/slm52i26jbtb1.jpg"
              rank="Rank 1000"
              user="Adam"
            />
          </div>

          {/* bottom right */}
          <div
            className="-rotate-[22deg] absolute right-[5%] bottom-[25%] z-10 translate-x-1/2 translate-y-1/2 transform transition-transform duration-300 ease-out"
            style={{
              transform: `translate(${-mousePosition.x * 30}px, ${-mousePosition.y * 30}px) rotate(-22deg)`,
            }}
          >
            <SubmissionCard
              avatarSrc={cards.sergio.image}
              description="I one shotted this with v0"
              hasBadge={false}
              previewSrc={cards.sergio.screenshot}
              rank={cards.sergio.rank}
              user={cards.sergio.name}
            />
          </div>

          {/* bottom left */}
          <div
            className="-translate-x-1/2 absolute bottom-[25%] left-[0%] z-10 translate-y-1/2 rotate-[22deg] transform transition-transform duration-300 ease-out"
            style={{
              transform: `translate(${-mousePosition.x * 20}px, ${-mousePosition.y * 20}px) rotate(22deg)`,
            }}
          >
            <SubmissionCard
              avatarSrc="https://avatars.githubusercontent.com/u/37756565?v=4"
              description="Here is my try"
              previewSrc="https://i.redd.it/slm52i26jbtb1.jpg"
              rank="New user"
              user="Ahmet"
            />
          </div>

          {/* top right */}
          <div
            className="-translate-y-1/2 absolute top-[30%] right-[0%] z-10 translate-x-1/2 rotate-[22deg] transform transition-transform duration-300 ease-out"
            style={{
              transform: `translate(${-mousePosition.x * 28}px, ${-mousePosition.y * 28}px) rotate(22deg)`,
            }}
          >
            <SubmissionCard
              avatarSrc={cards.ahmet.image}
              description={cards.ahmet.description}
              hasBadge={true}
              previewSrc={cards.ahmet.screenshot}
              rank={cards.ahmet.rank}
              user={cards.ahmet.name}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <Spinner />
        </div>
      }
    >
      <SignUpContent />
    </Suspense>
  );
}