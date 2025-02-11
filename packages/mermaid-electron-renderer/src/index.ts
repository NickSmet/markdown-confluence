import { BrowserWindow } from "@electron/remote";
import { ChartData, MermaidRenderer } from "@markdown-confluence/lib";
import type { MermaidConfig } from "@markdown-confluence/lib/dist/Settings";

const defaultMermaidConfig: MermaidConfig = {
	theme: "base",
	themeVariables: {
		background: "#ffffff",
		mainBkg: "#ddebff",
		primaryColor: "#ddebff",
		primaryTextColor: "#192b50",
		primaryBorderColor: "#0052cc",
		secondaryColor: "#ff8f73",
		secondaryTextColor: "#192b50",
		secondaryBorderColor: "#df360c",
		tertiaryColor: "#c0b6f3",
		tertiaryTextColor: "#fefefe",
		tertiaryBorderColor: "#5243aa",
		noteBkgColor: "#ffc403",
		noteTextColor: "#182a4e",
		textColor: "#000000",
		titleColor: "#0052cc",
	},
};

/**
 * Renderer for Mermaid diagrams using Electron's BrowserWindow.
 *
 * This renderer is designed to be used with MermaidRendererPlugin, where:
 * 1. The constructor takes styling parameters for the HTML container
 * 2. The actual mermaid configuration is passed through the captureMermaidCharts method
 *
 * @example
 * ```typescript
 * const renderer = new ElectronMermaidRenderer(
 *   extraStyleSheets,
 *   extraStyles,
 *   bodyClasses
 * );
 * const plugin = new MermaidRendererPlugin(renderer, mermaidConfig);
 * ```
 */
export class ElectronMermaidRenderer implements MermaidRenderer {
	/**
	 * Creates a new ElectronMermaidRenderer
	 *
	 * @param extraStyleSheets - Additional stylesheets to include in the rendering container
	 * @param extraStyles - Additional styles to include in the rendering container
	 * @param bodyClasses - Classes to add to the body element of the rendering container
	 */
	constructor(
		private extraStyleSheets: string[] = [],
		private extraStyles: string[] = [],
		private bodyClasses = "",
	) {}

	private getFileContentBlob(
		mermaidData: string,
		config: MermaidConfig = defaultMermaidConfig,
	) {
		const extraStyleSheets = this.extraStyleSheets
			.map((sheet) => `<link rel="stylesheet" href="${sheet}">`)
			.join("\n");
		const extraStyles = this.extraStyles
			.map((style) => `<style>${style}</style>`)
			.join("\n");

		return `
			<!DOCTYPE html>
			<html>
			<head>
				<script type="module">
					import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs';
					mermaid.initialize(${JSON.stringify(config)});
					window.mermaid = mermaid;
				</script>
				${extraStyleSheets}
				${extraStyles}
			</head>
			<body class="${this.bodyClasses}">
				<div class="mermaid">
					${mermaidData}
				</div>
			</body>
			</html>
		`;
	}

	async captureMermaidCharts(
		charts: ChartData[],
		config?: MermaidConfig,
	): Promise<Map<string, Buffer>> {
		const capturedCharts = new Map<string, Buffer>();

		const promises = charts.map(async (chart) => {
			const window = new BrowserWindow({
				width: 800,
				height: 600,
				show: false,
				webPreferences: {
					offscreen: true,
				},
			});

			try {
				const fileContent = this.getFileContentBlob(
					chart.data,
					config || defaultMermaidConfig,
				);
				const dataUrl = `data:text/html;base64,${Buffer.from(
					fileContent,
				).toString("base64")}`;

				await window.loadURL(dataUrl);

				const image = await window.webContents.capturePage();
				const imageBuffer = image.toPNG();

				capturedCharts.set(chart.name, imageBuffer);
			} finally {
				window.destroy();
			}
		});

		await Promise.all(promises);

		return capturedCharts;
	}
}
