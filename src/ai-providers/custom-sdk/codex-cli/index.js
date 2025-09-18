/**
 * @fileoverview Codex CLI provider factory and exports
 */

import { NoSuchModelError } from '@ai-sdk/provider';
import { CodexCliLanguageModel } from './language-model.js';

/**
 * @typedef {import('./types.js').CodexCliSettings} CodexCliSettings
 * @typedef {import('./types.js').CodexCliModelId} CodexCliModelId
 * @typedef {import('./types.js').CodexCliProvider} CodexCliProvider
 * @typedef {import('./types.js').CodexCliProviderSettings} CodexCliProviderSettings
 */

/**
 * Create a Codex CLI provider using the official SDK
 * @param {CodexCliProviderSettings} [options={}] - Provider configuration options
 * @returns {CodexCliProvider} Codex CLI provider instance
 */
export function createCodexCli(options = {}) {
	/**
	 * Create a language model instance
	 * @param {CodexCliModelId} modelId - Model ID
	 * @param {CodexCliSettings} [settings={}] - Model settings
	 * @returns {CodexCliLanguageModel}
	 */
	const createModel = (modelId, settings = {}) => {
		return new CodexCliLanguageModel({
			id: modelId,
			settings: {
				...options.defaultSettings,
				...settings
			}
		});
	};

	/**
	 * Provider function
	 * @param {CodexCliModelId} modelId - Model ID
	 * @param {CodexCliSettings} [settings] - Model settings
	 * @returns {CodexCliLanguageModel}
	 */
	const provider = function (modelId, settings) {
		if (new.target) {
			throw new Error(
				'The Codex CLI model function cannot be called with the new keyword.'
			);
		}

		return createModel(modelId, settings);
	};

	provider.languageModel = createModel;
	provider.chat = createModel; // Alias for languageModel

	// Add textEmbeddingModel method that throws NoSuchModelError
	provider.textEmbeddingModel = (modelId) => {
		throw new NoSuchModelError({
			modelId,
			modelType: 'textEmbeddingModel'
		});
	};

	return /** @type {CodexCliProvider} */ (provider);
}

/**
 * Default Codex CLI provider instance
 */
export const codexCli = createCodexCli();

// Provider exports
export { CodexCliLanguageModel } from './language-model.js';

// Error handling exports
export {
	isAuthenticationError,
	isTimeoutError,
	getErrorMetadata,
	createAPICallError,
	createAuthenticationError,
	createTimeoutError
} from './errors.js';
