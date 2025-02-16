import { ConfluenceSettings, DEFAULT_SETTINGS } from "../Settings";
import { DefaultSettingsLoader } from "./DefaultSettingsLoader";
import { EnvironmentVariableSettingsLoader } from "./EnvironmentVariableSettingsLoader";
import { ConfigFileSettingsLoader } from "./ConfigFileSettingsLoader";
import { CommandLineArgumentSettingsLoader } from "./CommandLineArgumentSettingsLoader";
import { SettingsLoader } from "./SettingsLoader";

export class AutoSettingsLoader extends SettingsLoader {
	constructor(private loaders: SettingsLoader[] = []) {
		super();

		if (loaders.length === 0) {
			this.loaders.push(new DefaultSettingsLoader());
			this.loaders.push(new ConfigFileSettingsLoader());
			this.loaders.push(new EnvironmentVariableSettingsLoader());
			this.loaders.push(new CommandLineArgumentSettingsLoader());
		}
	}

	private combineSettings(): ConfluenceSettings {
		let settings = { ...DEFAULT_SETTINGS };

		for (const loader of this.loaders) {
			const partialSettings = loader.loadPartial();
			console.log(
				"Combining settings from loader:",
				loader.constructor.name,
				JSON.stringify(partialSettings, null, 2),
			);

			for (const key in partialSettings) {
				const propertyKey = key as keyof ConfluenceSettings;
				if (
					Object.prototype.hasOwnProperty.call(
						partialSettings,
						propertyKey,
					)
				) {
					const element = partialSettings[propertyKey];
					if (element !== undefined && element !== null) {
						if (
							propertyKey === "mermaid" &&
							typeof element === "object" &&
							!Array.isArray(element)
						) {
							settings.mermaid = {
								...settings.mermaid,
								...element,
							};
						} else {
							(settings as any)[propertyKey] = element;
						}
					}
				}
			}
		}

		console.log(
			"Final combined settings:",
			JSON.stringify(settings, null, 2),
		);
		return settings;
	}

	loadPartial(): Partial<ConfluenceSettings> {
		return this.combineSettings();
	}
}
