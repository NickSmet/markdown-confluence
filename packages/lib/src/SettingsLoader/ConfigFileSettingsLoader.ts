import path from "path";
import { ConfluenceSettings } from "../Settings";
import { SettingsLoader } from "./SettingsLoader";
import fs from "fs";
import yargs from "yargs";

export class ConfigFileSettingsLoader extends SettingsLoader {
	private configPath: string = path.join(
		process.cwd() ?? "",
		".markdown-confluence.json",
	);

	constructor(configPath?: string) {
		super();

		if (configPath) {
			this.configPath = configPath;
			return;
		}

		if (
			"CONFLUENCE_CONFIG_FILE" in process.env &&
			process.env["CONFLUENCE_CONFIG_FILE"]
		) {
			this.configPath = process.env["CONFLUENCE_CONFIG_FILE"];
		}

		const options = yargs(process.argv)
			.option("config", {
				alias: "c",
				describe: "Path to the config file",
				type: "string",
				default: this.configPath,
				demandOption: false,
			})
			.parseSync();

		this.configPath = options.config;
	}

	loadPartial(): Partial<ConfluenceSettings> {
		try {
			const configData = fs.readFileSync(this.configPath, {
				encoding: "utf-8",
			});
			const config = JSON.parse(configData);
			console.log(
				"Loaded config from file:",
				JSON.stringify(config, null, 2),
			);
			return config;
		} catch (error) {
			console.error("Error loading config file:", error);
			return {};
		}
	}
}
