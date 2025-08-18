import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowRight } from "lucide-react"

export default function HomePage() {
  return (
    <div
      className="min-h-screen text-white relative overflow-hidden"
      style={{
        background: "linear-gradient(180deg, rgba(22, 22, 22, 1) 0%, rgba(12, 12, 12, 1) 100%)",
      }}
    >
      {/* Background geometric shapes */}
      <div className="absolute inset-0 overflow-hidden">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="153"
          height="179"
          viewBox="0 0 153 179"
          fill="none"
          className="absolute bottom-0 right-0 z-0 transition-transform duration-300 ease-out desktop-svg"
          style={{
            transform: "translate(50%, 20%)",
            width: "70vw",
            height: "80vh",
            minWidth: "800px",
            minHeight: "900px",
            opacity: 0.3,
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
              <stop stopColor="rgba(239, 239, 239, 1)" />
              <stop offset="1" stopColor="rgba(146, 146, 146, 1)" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between p-6 max-w-7xl mx-auto">
        <div className="flex items-center">
          <img
            src="https://www.bounty.new/_next/image?url=%2Fbdn-b-w-trans.png&w=64&q=75"
            alt="Bounty Logo"
            className="w-10 h-10"
          />
        </div>

        <nav className="flex items-center gap-8">
          <a href="#" className="text-gray-300 hover:text-white transition-colors">
            Blog
          </a>
          <a href="#" className="text-gray-300 hover:text-white transition-colors">
            Contributors
          </a>
          <Button variant="secondary" className="bg-white text-black hover:bg-gray-100">
            GitHub
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </nav>
      </header>

      {/* Main content */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-20">
        <div className="max-w-4xl">
          <h1 className="text-7xl font-bold mb-8 leading-tight" style={{ color: "rgba(239, 239, 239, 1)" }}>
            Ship fast.
            <br />
            Get paid faster.
          </h1>

          <p className="text-xl mb-12 max-w-2xl leading-relaxed" style={{ color: "rgba(146, 146, 146, 1)" }}>
            The bounty platform where creators post challenges and developers deliver solutions. Instant payouts,
            integration, zero friction.
          </p>


          {/* Statistics cards */}
          <div className="flex gap-8">
            <div className="bg-transparent p-8 min-w-[200px] relative">
              {/* Corner brackets */}
              <div className="absolute top-0 left-0 w-6 h-6 border-t border-l border-[#282828]"></div>
              <div className="absolute top-0 right-0 w-6 h-6 border-t border-r border-[#282828]"></div>
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b border-l border-[#282828]"></div>
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b border-r border-[#282828]"></div>

              <div className="text-4xl font-bold text-green-400 mb-2">$75,700</div>
              <div className="text-gray-400">paid out today</div>
            </div>

            <div className="bg-transparent p-8 min-w-[200px] relative">
              {/* Corner brackets */}
              <div className="absolute top-0 left-0 w-6 h-6 border-t border-l border-[#282828]"></div>
              <div className="absolute top-0 right-0 w-6 h-6 border-t border-r border-[#282828]"></div>
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b border-l border-[#282828]"></div>
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b border-r border-[#282828]"></div>

              <div className="text-4xl font-bold text-blue-400 mb-2">207</div>
              <div className="text-gray-400">active bounties</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
