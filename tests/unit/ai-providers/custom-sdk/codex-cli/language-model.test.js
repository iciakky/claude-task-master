import { jest } from '@jest/globals';

// Mock modules before importing
jest.unstable_mockModule('@ai-sdk/provider', () => ({
	NoSuchModelError: class NoSuchModelError extends Error {
		constructor({ modelId, modelType }) {
			super(`No such model: ${modelId}`);
			this.modelId = modelId;
			this.modelType = modelType;
		}
	}
}));

jest.unstable_mockModule('@ai-sdk/provider-utils', () => ({
	generateId: jest.fn(() => 'test-id-123')
}));

jest.unstable_mockModule(
	'../../../../../src/ai-providers/custom-sdk/codex-cli/message-converter.js',
	() => ({
		convertToCodexCliMessages: jest.fn((prompt) => ({
			messagesPrompt: 'converted-prompt',
			systemPrompt: 'system'
		}))
	})
);

jest.unstable_mockModule(
	'../../../../../src/ai-providers/custom-sdk/codex-cli/json-extractor.js',
	() => ({
		extractJson: jest.fn((text) => text)
	})
);

jest.unstable_mockModule(
	'../../../../../src/ai-providers/custom-sdk/codex-cli/errors.js',
	() => ({
		createAPICallError: jest.fn((opts) => new Error(opts.message)),
		createAuthenticationError: jest.fn((opts) => new Error(opts.message))
	})
);

// This mock will be controlled by tests
let mockCodexCliModule = null;
jest.unstable_mockModule('@openai/codex-cli', () => {
	if (mockCodexCliModule) {
		return mockCodexCliModule;
	}
	throw new Error("Cannot find module '@openai/codex-cli'");
}, { virtual: true });

// Import the module under test
const { CodexCliLanguageModel } = await import(
	'../../../../../src/ai-providers/custom-sdk/codex-cli/language-model.js'
);

describe('CodexCliLanguageModel', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		// Reset the module mock
		mockCodexCliModule = null;
		// Clear module cache to ensure fresh imports
		jest.resetModules();
	});

	describe('constructor', () => {
		it('should initialize with valid model ID', () => {
			const model = new CodexCliLanguageModel({
				id: 'opus',
				settings: { maxTurns: 5 }
			});

			expect(model.modelId).toBe('opus');
			expect(model.settings).toEqual({ maxTurns: 5 });
			expect(model.provider).toBe('codex-cli');
		});

		it('should throw NoSuchModelError for invalid model ID', async () => {
			expect(
				() =>
					new CodexCliLanguageModel({
						id: '',
						settings: {}
					})
			).toThrow('No such model: ');

			expect(
				() =>
					new CodexCliLanguageModel({
						id: null,
						settings: {}
					})
			).toThrow('No such model: null');
		});
	});

	describe('lazy loading of @openai/codex-cli', () => {
		it('should throw error when package is not installed', async () => {
			// Keep mockCodexCliModule as null to simulate missing package
			const model = new CodexCliLanguageModel({
				id: 'opus',
				settings: {}
			});

			await expect(
				model.doGenerate({
					prompt: [{ role: 'user', content: 'test' }],
					mode: { type: 'regular' }
				})
			).rejects.toThrow(
				"Codex CLI SDK is not installed. Please install '@openai/codex-cli' to use the codex-cli provider."
			);
		});

		it('should load package successfully when available', async () => {
			// Mock successful package load
			const mockQuery = jest.fn(async function* () {
				yield {
					type: 'assistant',
					message: { content: [{ type: 'text', text: 'Hello' }] }
				};
				yield {
					type: 'result',
					subtype: 'done',
					usage: { output_tokens: 10, input_tokens: 5 }
				};
			});

			mockCodexCliModule = {
				query: mockQuery,
				AbortError: class AbortError extends Error {}
			};

			// Need to re-import to get fresh module with mocks
			jest.resetModules();
			const { CodexCliLanguageModel: FreshModel } = await import(
				'../../../../../src/ai-providers/custom-sdk/codex-cli/language-model.js'
			);

			const model = new FreshModel({
				id: 'opus',
				settings: {}
			});

			const result = await model.doGenerate({
				prompt: [{ role: 'user', content: 'test' }],
				mode: { type: 'regular' }
			});

			expect(result.text).toBe('Hello');
			expect(mockQuery).toHaveBeenCalled();
		});

		it('should only attempt to load package once', async () => {
			// Get a fresh import to ensure clean state
			jest.resetModules();
			const { CodexCliLanguageModel: TestModel } = await import(
				'../../../../../src/ai-providers/custom-sdk/codex-cli/language-model.js'
			);

			const model = new TestModel({
				id: 'opus',
				settings: {}
			});

			// First call should throw
			await expect(
				model.doGenerate({
					prompt: [{ role: 'user', content: 'test' }],
					mode: { type: 'regular' }
				})
			).rejects.toThrow('Codex CLI SDK is not installed');

			// Second call should also throw without trying to load again
			await expect(
				model.doGenerate({
					prompt: [{ role: 'user', content: 'test' }],
					mode: { type: 'regular' }
				})
			).rejects.toThrow('Codex CLI SDK is not installed');
		});
	});

	describe('generateUnsupportedWarnings', () => {
		it('should generate warnings for unsupported parameters', () => {
			const model = new CodexCliLanguageModel({
				id: 'opus',
				settings: {}
			});

			const warnings = model.generateUnsupportedWarnings({
				temperature: 0.7,
				maxTokens: 1000,
				topP: 0.9,
				seed: 42
			});

			expect(warnings).toHaveLength(4);
			expect(warnings[0]).toEqual({
				type: 'unsupported-setting',
				setting: 'temperature',
				details:
					'Codex CLI does not support the temperature parameter. It will be ignored.'
			});
		});

		it('should return empty array when no unsupported parameters', () => {
			const model = new CodexCliLanguageModel({
				id: 'opus',
				settings: {}
			});

			const warnings = model.generateUnsupportedWarnings({});
			expect(warnings).toEqual([]);
		});
	});

	describe('getModel', () => {
		it('should map model IDs correctly', () => {
			const model = new CodexCliLanguageModel({
				id: 'opus',
				settings: {}
			});

			expect(model.getModel()).toBe('opus');
		});

		it('should return unmapped model IDs as-is', () => {
			const model = new CodexCliLanguageModel({
				id: 'custom-model',
				settings: {}
			});

			expect(model.getModel()).toBe('custom-model');
		});
	});
});
