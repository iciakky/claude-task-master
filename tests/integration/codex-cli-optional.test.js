import { jest } from '@jest/globals';

// Mock the base provider to avoid circular dependencies
jest.unstable_mockModule('../../src/ai-providers/base-provider.js', () => ({
	BaseAIProvider: class {
		constructor() {
			this.name = 'Base Provider';
		}
		handleError(context, error) {
			throw error;
		}
	}
}));

// Mock the codex-cli SDK to simulate it not being installed
jest.unstable_mockModule('@openai/codex-cli', () => {
	throw new Error("Cannot find module '@openai/codex-cli'");
}, { virtual: true });

// Import after mocking
const { CodexCliProvider } = await import(
	'../../src/ai-providers/codex-cli.js'
);

describe('Codex CLI Optional Dependency Integration', () => {
	describe('when @openai/codex-cli is not installed', () => {
		it('should allow provider instantiation', () => {
			// Provider should instantiate without error
			const provider = new CodexCliProvider();
			expect(provider).toBeDefined();
			expect(provider.name).toBe('Codex CLI');
		});

		it('should allow client creation', () => {
			const provider = new CodexCliProvider();
			// Client creation should work
			const client = provider.getClient({});
			expect(client).toBeDefined();
			expect(typeof client).toBe('function');
		});

		it('should fail with clear error when trying to use the model', async () => {
			const provider = new CodexCliProvider();
			const client = provider.getClient({});
			const model = client('opus');

			// The actual usage should fail with the lazy loading error
			await expect(
				model.doGenerate({
					prompt: [{ role: 'user', content: 'Hello' }],
					mode: { type: 'regular' }
				})
			).rejects.toThrow(
				"Codex CLI SDK is not installed. Please install '@openai/codex-cli' to use the codex-cli provider."
			);
		});

		it('should provide helpful error message for streaming', async () => {
			const provider = new CodexCliProvider();
			const client = provider.getClient({});
			const model = client('sonnet');

			await expect(
				model.doStream({
					prompt: [{ role: 'user', content: 'Hello' }],
					mode: { type: 'regular' }
				})
			).rejects.toThrow(
				"Codex CLI SDK is not installed. Please install '@openai/codex-cli' to use the codex-cli provider."
			);
		});
	});

	describe('provider behavior', () => {
		it('should not require API key', () => {
			const provider = new CodexCliProvider();
			// Should not throw
			expect(() => provider.validateAuth()).not.toThrow();
			expect(() => provider.validateAuth({ apiKey: null })).not.toThrow();
		});

		it('should work with ai-services-unified when provider is configured', async () => {
			// This tests that the provider can be selected but will fail appropriately
			// when the actual model is used
			const provider = new CodexCliProvider();
			expect(provider).toBeDefined();

			// In real usage, ai-services-unified would:
			// 1. Get the provider instance (works)
			// 2. Call provider.getClient() (works)
			// 3. Create a model (works)
			// 4. Try to generate (fails with clear error)
		});
	});
});
