import { IVeryLaunchFeature } from "~~/types/interface";

export const veryLaunchFeatures: IVeryLaunchFeature[] = [
  {
    id: 1,
    title: "Campaign Creation",
    description:
      "Creators can launch token campaigns with custom supply, funding targets, and metadata in just a few clicks.",
  },
  {
    id: 2,
    title: "Instant Liquidity",
    description:
      "Once a campaign succeeds, liquidity is deployed automatically to Very Network DEX using raised WVERY and allocated tokens.",
  },
  {
    id: 3,
    title: "WVERY Fundraising",
    description:
      "All campaigns raise funds in WVERY (Wrapped Very) for predictable pricing and stable treasury management.",
  },
  {
    id: 4,
    title: "Refund Protection",
    description:
      "If a campaign fails or is cancelled, users can claim a full refund of their WVERY contribution at any time.",
  },
  {
    id: 5,
    title: "OG Points System",
    description:
      "Users earn OG Points by buying into sponsored campaigns, which qualify them for monthly revenue share from platform fees.",
  },
  {
    id: 6,
    title: "Real-Time Analytics",
    description: "Campaign dashboards display live stats on funds raised, token pricing, pool reserves, and volume.",
  },
];
