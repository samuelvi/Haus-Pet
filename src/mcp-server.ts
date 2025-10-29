#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

const API_BASE_URL = process.env.HAUSPET_API_URL || "http://localhost:3000";

// Tool schemas
const ListPetsSchema = z.object({});

const ListPetsByTypeSchema = z.object({
  type: z.enum(["cat", "dog", "bird"]).describe("Type of pet to list"),
});

const GetRandomPetSchema = z.object({
  type: z.enum(["cat", "dog", "bird"]).optional().describe("Optional: type of pet for random selection"),
});

const AddPetSchema = z.object({
  breed: z.string().min(1).describe("The name of the pet breed"),
  type: z.enum(["cat", "dog", "bird"]).describe("Type of pet (cat, dog, or bird)"),
});

// Helper function to make API requests
async function fetchFromAPI(endpoint: string, options?: RequestInit): Promise<any> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
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
        name: "list_all_pets",
        description: "Get a list of all pet breeds available in the HausPet database",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "list_pets_by_type",
        description: "Get a list of pet breeds filtered by type (cat, dog, or bird)",
        inputSchema: {
          type: "object",
          properties: {
            type: {
              type: "string",
              enum: ["cat", "dog", "bird"],
              description: "Type of pet to list",
            },
          },
          required: ["type"],
        },
      },
      {
        name: "get_random_pet",
        description: "Get a random pet breed, optionally filtered by type",
        inputSchema: {
          type: "object",
          properties: {
            type: {
              type: "string",
              enum: ["cat", "dog", "bird"],
              description: "Optional: type of pet for random selection",
            },
          },
        },
      },
      {
        name: "add_pet",
        description: "Add a new pet breed to the HausPet database",
        inputSchema: {
          type: "object",
          properties: {
            breed: {
              type: "string",
              description: "The name of the pet breed (e.g., 'Labrador', 'Persian', 'Canary')",
            },
            type: {
              type: "string",
              enum: ["cat", "dog", "bird"],
              description: "Type of pet (cat, dog, or bird)",
            },
          },
          required: ["breed", "type"],
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
      case "list_all_pets": {
        ListPetsSchema.parse(args);
        const data = await fetchFromAPI("/api/pets");
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(data, null, 2),
            },
          ],
        };
      }

      case "list_pets_by_type": {
        const { type } = ListPetsByTypeSchema.parse(args);
        const data = await fetchFromAPI(`/api/pets/${type}`);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(data, null, 2),
            },
          ],
        };
      }

      case "get_random_pet": {
        const { type } = GetRandomPetSchema.parse(args);
        const endpoint = type
          ? `/api/pets/${type}/random-pet`
          : "/api/pets/random-pet";
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

      case "add_pet": {
        const { breed, type } = AddPetSchema.parse(args);
        const data = await fetchFromAPI(`/api/pets/${type}/add`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ breed }),
        });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                message: `Successfully added ${breed} to ${type}s`,
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
