export const FROM_ADDRESSES = {
	notifications: "Bounty.new <notifications@mail.bounty.new>",
	support: "Bounty.new Support <support@mail.bounty.new>",
	marketing: "Bounty.new <hi@mail.bounty.new>",
	general: "Bounty.new <grim@mail.bounty.new>",
} as const;

export type FromKey = keyof typeof FROM_ADDRESSES;

export const AUDIENCES = {
	marketing: "be47467f-19a3-401e-bab5-f94ac3822bfe",
} as const;

export type AudienceKey = keyof typeof AUDIENCES;
