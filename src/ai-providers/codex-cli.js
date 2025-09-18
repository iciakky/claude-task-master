/**
 * src/ai-providers/codex-cli.js
 *
 * Implementation for interacting with Codex models via Codex CLI
 * using a custom AI SDK implementation.
 */

import { createCodexCli } from './custom-sdk/codex-cli/index.js';
import { BaseAIProvider } from './base-provider.js';
import { getCodexCliSettingsForCommand } from '../../scripts/modules/config-manager.js';

export class CodexCliProvider extends BaseAIProvider {
	constructor() {
		super();
		this.name = 'Codex CLI';
	}

	getRequiredApiKeyName() {
		return 'CODEX_CLI_API_KEY';
	}

	isRequiredApiKey() {
		return false;
	}

	/**
	 * Override validateAuth to skip API key validation for Codex CLI
	 * @param {object} params - Parameters to validate
	 */
	validateAuth(params) {
		// Codex CLI doesn't require an API key
		// No validation needed
	}

	/**
	 * Creates and returns a Codex CLI client instance.
	 * @param {object} params - Parameters for client initialization
	 * @param {string} [params.commandName] - Name of the command invoking the service
	 * @param {string} [params.baseURL] - Optional custom API endpoint (not used by Codex CLI)
	 * @returns {Function} Codex CLI client function
	 * @throws {Error} If initialization fails
	 */
	getClient(params) {
		try {
			// Codex CLI doesn't use API keys or base URLs
			// Just return the provider factory
			return createCodexCli({
				defaultSettings: getCodexCliSettingsForCommand(params?.commandName)
			});
		} catch (error) {
			this.handleError('client initialization', error);
		}
	}
}
