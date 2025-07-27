import { publicProcedure, router } from "../trpc";

export const newsRouter = router({
  getNews: publicProcedure.query(async () => {
    // Mock news data - in production, this would fetch from a real news API
    const mockNews = [
      {
        href: "https://github.com/ripgrim/bounty.new",
        title: "New Bounty Platform Launch",
        summary: "A revolutionary platform connecting developers with rewarding opportunities through bounties.",
        image: "/og-image.png",
      },
      {
        href: "https://bounty.new/contributors",
        title: "Top Contributors This Month",
        summary: "Discover the most active developers who completed bounties and earned rewards.",
        image: "/bdn-w-b-figure.png",
      },
      {
        href: "https://bounty.new/dashboard",
        title: "Create Your First Bounty",
        summary: "Learn how to post your first bounty and start getting help from the community.",
        image: "/bdn-b-w-figure.png",
      },
      {
        href: "https://github.com/ripgrim/bounty.new/issues",
        title: "Platform Updates",
        summary: "Latest features and improvements to the bounty platform experience.",
        image: "/og-image.png",
      },
      {
        href: "https://bounty.new/waitlist",
        title: "Early Access Program",
        summary: "Join the waitlist to get early access to new features and premium tools.",
        image: "/bdn-b-w-trans.png",
      },
    ];

    return mockNews;
  }),
});
