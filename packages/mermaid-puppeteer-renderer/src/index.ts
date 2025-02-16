import { MermaidConfig } from "@markdown-confluence/lib";
import { ChartData, MermaidRenderer } from "@markdown-confluence/lib";
import puppeteer, { PuppeteerLaunchOptions } from "puppeteer";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

declare global {
	interface Window {
		renderMermaidChart: (
			chart: string,
			config?: MermaidConfig,
		) => Promise<string>;
	}
}

export interface PuppeteerMermaidRendererConfig {
	puppeteerConfig?: PuppeteerLaunchOptions;
}

export class PuppeteerMermaidRenderer implements MermaidRenderer {
	private config: PuppeteerMermaidRendererConfig;

	constructor(config: PuppeteerMermaidRendererConfig = {}) {
		this.config = config;
	}

	async captureMermaidCharts(
		charts: ChartData[],
		mermaidConfig?: MermaidConfig,
	): Promise<Map<string, Buffer>> {
		console.log("Starting Mermaid chart rendering...");
		console.log(
			"Using Mermaid config:",
			JSON.stringify(mermaidConfig, null, 2),
		);
		const browser = await puppeteer.launch({
			headless: "new",
			args: ["--no-sandbox", "--disable-setuid-sandbox"],
			...this.config.puppeteerConfig,
		});

		try {
			const page = await browser.newPage();
			await page.setViewport({
				width: 7000,
				height: 5000,
				deviceScaleFactor: 4,
			});
			const results = new Map<string, Buffer>();

			// Create a temporary HTML file
			const tempDir = os.tmpdir();
			const tempHtmlPath = path.join(
				tempDir,
				`mermaid-${Date.now()}.html`,
			);
			const htmlContent = `
				<!DOCTYPE html>
				<html>
				<head>
					<script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
					<script>
						window.renderMermaidChart = async function(chart, config) {
							try {
								console.log('Browser: Initializing Mermaid with config:', JSON.stringify(config, null, 2));
								const mermaidConfig = {
									startOnLoad: false,
									theme: config?.theme || 'default',
									themeVariables: config?.themeVariables || {},
									...config
								};
								console.log('Browser: Final Mermaid config:', JSON.stringify(mermaidConfig, null, 2));
								mermaid.initialize(mermaidConfig);
								const { svg } = await mermaid.render('mermaid-chart', chart);
								return svg;
							} catch (error) {
								console.error('Mermaid rendering error:', error);
								throw error;
							}
						}
					</script>
					<style>
						body { margin: 0; padding: 20px; }
						#container { display: inline-block; }
					</style>
				</head>
				<body>
					<div id="container"></div>
				</body>
				</html>
			`;
			fs.writeFileSync(tempHtmlPath, htmlContent);

			console.log("Loading temporary HTML file...");
			await page.goto(`file://${tempHtmlPath}`);

			// Enable console logging from the browser
			page.on("console", (msg) => console.log("Browser:", msg.text()));

			for (const chart of charts) {
				console.log(`Rendering chart: ${chart.name}`);
				try {
					const svg = await page.evaluate(
						(chartData, config) =>
							window.renderMermaidChart(chartData, config),
						chart.data,
						mermaidConfig,
					);

					// Insert the SVG into the container
					await page.evaluate((svgContent) => {
						const container = document.getElementById("container");
						if (container) {
							container.innerHTML = svgContent;
						}
					}, svg);

					// Wait for any animations to complete
					await page.waitForTimeout(100);

					// Get the container element
					const container = await page.$("#container");
					if (!container) {
						throw new Error("Container element not found");
					}

					// Get the bounding box of the container
					const boundingBox = await container.boundingBox();
					if (!boundingBox) {
						throw new Error(
							"Could not get bounding box of the container",
						);
					}

					// Take a screenshot of just the container
					const imageBuffer = (await container.screenshot({
						type: "png",
						omitBackground: false,
						clip: {
							x: boundingBox.x,
							y: boundingBox.y,
							width: boundingBox.width,
							height: boundingBox.height,
						},
					})) as Buffer;

					results.set(chart.name, imageBuffer);
					console.log(`Successfully rendered chart: ${chart.name}`);
				} catch (error) {
					console.error(
						`Error rendering chart ${chart.name}:`,
						error,
					);
					throw error;
				}
			}

			// Clean up
			fs.unlinkSync(tempHtmlPath);
			console.log("Mermaid chart rendering completed.");
			return results;
		} finally {
			await browser.close();
		}
	}
}
