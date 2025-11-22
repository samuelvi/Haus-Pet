# HausPet MCP Server

An MCP (Model Context Protocol) server to interact with the HausPet API from Claude Desktop.

## Features

The MCP exposes 4 tools to interact with breeds:

- **list_all_breeds**: List all available breeds
- **list_breeds_by_type**: List breeds filtered by type (cat, dog, bird)
- **get_random_breed**: Get a random breed (optionally by type)
- **add_breed**: Add a new breed to the database

## Installation

### 1. Build the project

```bash
cd app/api
npm install
npm run build
```

This will compile TypeScript to `app/api/dist/`.

### 2. Configure Claude Desktop

Edit the Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

You can use the example file included in this project as a reference:
[`docs/claude-desktop-config.example.json`](./claude-desktop-config.example.json)

Add the following configuration (adjust the path for your system):

```json
{
  "mcpServers": {
    "hauspet": {
      "command": "node",
      "args": [
        "/absolute/path/to/HausPet/app/api/dist/mcp-server.js"
      ],
      "env": {
        "HAUSPET_API_URL": "http://localhost:3000",
        "MCP_API_TOKEN": "mcp-dev-token-admin-hauspet-2024"
      }
    }
  }
}
```

**Note:** Replace `/absolute/path/to/HausPet` with the absolute path where you cloned this repository.

### 3. Start the services

Before using the MCP, ensure the HausPet API is running:

```bash
# Start all services with Docker
make up
```

The API, worker, and all dependencies will start automatically.

### 4. Restart Claude Desktop

Close and reopen Claude Desktop to load the MCP configuration.

## Usage

Once configured, you can ask Claude questions like:

### Read Operations
- "Can you list all available breeds?"
- "Show me all dogs"
- "Give me a random breed"
- "What cats do you have in the database?"
- "Give me a random bird"

### Write Operations
- "Add a Beagle to the database"
- "Add a Siamese cat"
- "Create a new breed: Golden Retriever, type dog"

Claude will automatically use the MCP tools to interact with your local API.

## Verification

To verify that the MCP is working correctly:

1. Open Claude Desktop
2. Look for the tools icon (🔧) or plugins section
3. You should see "hauspet" listed with 4 available tools

## Environment Variables

- `HAUSPET_API_URL`: Base API URL (default: `http://localhost:3000`)
- `MCP_API_TOKEN`: Static authentication token for protected operations (required for `add_breed`)

### ⚠️ Authentication for Write Operations

**Write operations** like `add_breed` require authentication. The MCP server uses a static API token that must be configured:

1. **In the project's `.env` file** (already configured):
   ```bash
   MCP_API_TOKEN=mcp-dev-token-admin-hauspet-2024
   ```

2. **In Claude Desktop configuration** (see example above):
   ```json
   "env": {
     "HAUSPET_API_URL": "http://localhost:3000",
     "MCP_API_TOKEN": "mcp-dev-token-admin-hauspet-2024"
   }
   ```

**Important**: The token must match in both files. In production, use a secure token and keep it secret.

## Testing the API Manually (Simulating MCP Calls)

You can test the API endpoints that the MCP uses with curl:

### Read Operations (Public - No Auth Required)

**List all breeds:**
```bash
curl http://localhost:3000/api/breeds
```

**List breeds by type:**
```bash
curl http://localhost:3000/api/breeds/type/dog
curl http://localhost:3000/api/breeds/type/cat
curl http://localhost:3000/api/breeds/type/bird
```

**Get random breed:**
```bash
curl http://localhost:3000/api/breeds/random-breed
```

**Get random breed by type:**
```bash
curl http://localhost:3000/api/breeds/dog/random-breed
```

### Write Operations (Protected - Auth Required)

**Add a new breed (requires MCP_API_TOKEN):**
```bash
curl -X POST http://localhost:3000/api/breeds/add \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer mcp-dev-token-admin-hauspet-2024" \
  -d '{"breed":"Bulldog","type":"dog"}'
```

**Add breed to specific type:**
```bash
curl -X POST http://localhost:3000/api/breeds/cat/add \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer mcp-dev-token-admin-hauspet-2024" \
  -d '{"breed":"Persian"}'
```

These are the same endpoints the MCP server calls when you interact with Claude Desktop.

## Troubleshooting

**MCP doesn't appear in Claude Desktop:**
- Verify that the path in `claude_desktop_config.json` is absolute and correct
- Make sure the path points to `app/api/dist/mcp-server.js` (not `tmp/dist/api/mcp-server.js`)
- Check Claude Desktop logs in the developer section
- Make sure you've restarted Claude Desktop after editing the config

**Connection error when making queries:**
- Verify that the API is running on `http://localhost:3000`
- Check that Docker services (Postgres, MongoDB, Redis) are active: `docker ps`
- Review server logs: `docker logs hauspet_api`

**Build fails:**
- Make sure you have all dependencies: `npm install`
- Verify Node.js version (requires >= 22)
- Check that you're in the correct directory: `cd app/api`

**Authentication errors on write operations:**
- Verify `MCP_API_TOKEN` is set in both `.env` and Claude Desktop config
- Ensure the token matches in both locations
- Check API logs for authentication errors: `docker logs hauspet_api`
