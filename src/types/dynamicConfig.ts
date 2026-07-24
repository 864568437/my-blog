export type DynamicConfig = {
	title?: string;
	description?: string;
	showComment?: boolean;
	itemsPerPage?: number;
	apiUrl?: string;

	coverImage?: string;
	coverAvatar?: string;
	coverName?: string;
	coverBio?: string;
	showCover?: boolean;

	memos?: DynamicMemosConfig;
};

export type DynamicMemosConfig = {
	enable: boolean;
	apiUrl: string;
	parent?: string;
};

export type DynamicItem = {
	id: string;
	published: number;
	html: string;
	images: Array<{ alt: string; src: string; title?: string }>;
	searchText: string;
	pinned: boolean;
	tags: string[];
	location: string;
	device: string;
	author: string;
	avatar: string;
};
