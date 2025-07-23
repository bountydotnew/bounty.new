import Image from "next/image";

export function Footer() {
    return (
        <footer className="flex w-full flex-row px-4 py-10 sm:px-6 sm:py-6 md:px-8 md:py-8">
            <div className="mx-auto flex w-full max-w-7xl flex-row items-center justify-between">
                <p className="text-md font-bold inline-flex items-center gap-2 tracking-tight text-foreground opacity-50">
                    <Image src="/bdn-b-w-trans.png" alt="Bounty.new Logo" width={32} height={32} />
                    <span className="text-xl font-medium hidden md:block">bounty.new</span>
                </p>

                <div className="flex flex-row items-center justify-center gap-4 text-muted-foreground">
                    <img alt="Vercel OSS Program" src="https://vercel.com/oss/program-badge.svg" className="h-6 w-auto opacity-70 hover:opacity-100 transition-opacity" />

                    <div className="flex flex-row items-center justify-center gap-2">
                        {/*<Link*/}
                        {/*  href="/terms"*/}
                        {/*  className="underline underline-offset-2 text-xs md:text-sm"*/}
                        {/*>*/}
                        {/*  Terms of Use*/}
                        {/*</Link>*/}
                        {/*<Link*/}
                        {/*  href="/privacy"*/}
                        {/*  className="underline underline-offset-2 text-xs md:text-sm"*/}
                        {/*>*/}
                        {/*  Privacy Policy*/}
                        {/*</Link>*/}

                        {/* <ModeToggle /> */}
                    </div>
                </div>
            </div>
        </footer>
    );
}
