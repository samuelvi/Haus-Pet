#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

const API_BASE_URL = process.env.HAUSPET_API_URL || "http://localhost:3000";
const MCP_API_TOKEN = process.env.MCP_API_TOKEN;

if (!MCP_API_TOKEN) {
  console.error("WARNING: MCP_API_TOKEN not set. Protected endpoints (like add_breed) will fail.");
}

// Tool schemas
const ListBreedsSchema = z.object({});

const ListBreedsByTypeSchema = z.object({
  type: z.enum(["cat", "dog", "bird"]).describe("Type of animal to list breeds for"),
});

const GetRandomBreedSchema = z.object({
  type: z.enum(["cat", "dog", "bird"]).optional().describe("Optional: type of animal for random breed selection"),
});

const AddBreedSchema = z.object({
  name: z.string().min(1).describe("The name of the breed"),
  animalType: z.enum(["cat", "dog", "bird"]).describe("Type of animal (cat, dog, or bird)"),
});

// Helper function to make API requests
async function fetchFromAPI(endpoint: string, options?: RequestInit): Promise<any> {
  const headers: HeadersInit = {
    ...((options?.headers as Record<string, string>) || {}),
  };

  // Add authentication token if available
  if (MCP_API_TOKEN) {
    headers['Authorization'] = `Bearer ${MCP_API_TOKEN}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API request failed (${response.status}): ${errorText}`);
  }
  return response.json();
}

// Create server instance
const server = new Server(
  {
    name: "hauspet-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "list_all_breeds",
        description: "Get a list of all breeds available in the HausPet database",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "list_breeds_by_type",
        description: "Get a list of breeds filtered by animal type (cat, dog, or bird)",
        inputSchema: {
          type: "object",
          properties: {
            type: {
              type: "string",
              enum: ["cat", "dog", "bird"],
              description: "Type of animal to list breeds for",
            },
          },
          required: ["type"],
        },
      },
      {
        name: "get_random_breed",
        description: "Get a random breed, optionally filtered by animal type",
        inputSchema: {
          type: "object",
          properties: {
            type: {
              type: "string",
              enum: ["cat", "dog", "bird"],
              description: "Optional: type of animal for random breed selection",
            },
          },
        },
      },
      {
        name: "add_breed",
        description: "Add a new breed to the HausPet database",
        inputSchema: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "The name of the breed (e.g., 'Labrador', 'Persian', 'Canary')",
            },
            animalType: {
              type: "string",
              enum: ["cat", "dog", "bird"],
              description: "Type of animal (cat, dog, or bird)",
            },
          },
          required: ["name", "animalType"],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "list_all_breeds": {
        ListBreedsSchema.parse(args);
        const data = await fetchFromAPI("/api/breeds");
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(data, null, 2),
            },
          ],
        };
      }

      case "list_breeds_by_type": {
        const { type } = ListBreedsByTypeSchema.parse(args);
        const data = await fetchFromAPI(`/api/breeds/${type}`);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(data, null, 2),
            },
          ],
        };
      }

      case "get_random_breed": {
        const { type } = GetRandomBreedSchema.parse(args);
        const endpoint = type
          ? `/api/breeds/${type}/random-breed`
          : "/api/breeds/random-breed";
        const data = await fetchFromAPI(endpoint);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(data, null, 2),
            },
          ],
        };
      }

      case "add_breed": {
        const { name, animalType } = AddBreedSchema.parse(args);
        const data = await fetchFromAPI(`/api/breeds/${animalType}/add`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name }),
        });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                message: `Successfully added ${name} to ${animalType} breeds`,
                data,
              }, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Invalid arguments: ${error.message}`);
    }
    throw error;
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("HausPet MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
