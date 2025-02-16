export type ConfluenceSettings = {
	confluenceBaseUrl: string;
	confluenceParentId: string;
	atlassianUserName: string;
	atlassianApiToken: string;
	folderToPublish: string;
	contentRoot: string;
	firstHeadingPageTitle: boolean;
	mermaid?: MermaidConfig;
};

export const DEFAULT_SETTINGS: ConfluenceSettings = {
	confluenceBaseUrl: "",
	confluenceParentId: "",
	atlassianUserName: "",
	atlassianApiToken: "",
	folderToPublish: "Confluence Pages",
	contentRoot: process.cwd(),
	firstHeadingPageTitle: false,
	mermaid: {
		theme: "default",
		themeVariables: {},
	},
};

export type MermaidConfig = {
	theme?: string;
	padding?: number;
	themeVariables?: {
		background?: string;
		mainBkg?: string;
		primaryColor?: string;
		primaryTextColor?: string;
		primaryBorderColor?: string;
		secondaryColor?: string;
		secondaryTextColor?: string;
		secondaryBorderColor?: string;
		tertiaryColor?: string;
		tertiaryTextColor?: string;
		tertiaryBorderColor?: string;
		noteBkgColor?: string;
		noteTextColor?: string;
		textColor?: string;
		titleColor?: string;
	};
};

export type Settings = ConfluenceSettings & {
	mermaid?: MermaidConfig;
};
