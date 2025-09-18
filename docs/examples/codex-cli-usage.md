# Codex CLI Provider Usage Example

The Codex CLI provider lets Task Master use your local Codex CLI subscription without storing an API key. Once the Codex CLI app is authenticated, Task Master can call it as another provider.

## Configuration

To route any role through Codex CLI, update `.taskmaster/config.json`:

```json
{
  "models": {
    "main": {
      "provider": "codex-cli",
      "modelId": "codex-pro",
      "maxTokens": 32000,
      "temperature": 0.2
    },
    "research": {
      "provider": "codex-cli",
      "modelId": "codex-lite",
      "maxTokens": 16000,
      "temperature": 0.1
    }
  },
  "codexCli": {
    "maxTurns": 6,
    "permissionMode": "plan"
  }
}
```

Task Master accepts `codexCli` settings globally and per command (see below) just like other providers.

## Available Models

- `codex-pro` – full Codex CLI subscription model (SWE score 0.65)
- `codex-lite` – lighter Codex CLI tier (SWE score 0.55)

Refer to [docs/models.md](../models.md) for updated metadata.

## Usage

Once configured, Codex CLI works with any Task Master command:

```bash
# Generate tasks from a PRD
task-master parse-prd --input=prd.txt

# Analyze project complexity
task-master analyze-complexity

# Show the next task to work on
task-master next

# Update task status
task-master set-status --id=task-001 --status=in-progress
```

## Requirements

1. Install the Codex CLI subscription client on your machine.
2. Sign in with the account that has Codex CLI access (`codex login`).
3. Leave the CLI running or ensure it can be invoked from the shell where Task Master runs.

## Custom Settings

Codex CLI exposes the same configurable surface area as other CLI-backed providers. You can define defaults under `codexCli` or override per command via `commandSpecific`:

```json
{
  "codexCli": {
    "maxTurns": 4,
    "customSystemPrompt": "Focus on concise patches",
    "commandSpecific": {
      "analyze-complexity": {
        "maxTurns": 2,
        "permissionMode": "acceptEdits"
      }
    }
  }
}
```

Unsupported AI SDK parameters (e.g. `temperature`, `maxTokens`, `seed`) are ignored by the Codex CLI bridge; Task Master will emit warnings similar to other providers.

## Additional Tips

- Codex CLI calls do not report cost, so telemetry shows `0` pricing by design.
- Keep the Codex CLI up to date (`codex update`) to benefit from the latest tooling integrations.
- Mix Codex CLI with API-backed providers by assigning different roles (e.g. `main` via Codex CLI, `fallback` via OpenRouter) in `.taskmaster/config.json`.
