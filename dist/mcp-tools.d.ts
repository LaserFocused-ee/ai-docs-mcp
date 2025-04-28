import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
export declare const SERVER_INFO: {
    name: string;
    version: string;
    description: string;
};
/**
 * Configure MCP server with tools
 */
export declare function configureServer(server: McpServer): void;
/**
 * List all available tools for the server
 */
export declare function getToolsList(): ({
    name: string;
    description: string;
    parameters: {
        type?: undefined;
        properties?: undefined;
        required?: undefined;
    };
} | {
    name: string;
    description: string;
    parameters: {
        type: string;
        properties: {
            category: {
                type: string;
                description: string;
                optional: boolean;
            };
            name: {
                type: string;
                description: string;
                optional?: undefined;
            };
            technology?: undefined;
            service?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    parameters: {
        type: string;
        properties: {
            name: {
                type: string;
                description: string;
                optional: boolean;
            };
            category?: undefined;
            technology?: undefined;
            service?: undefined;
        };
        required?: undefined;
    };
} | {
    name: string;
    description: string;
    parameters: {
        type: string;
        properties: {
            technology: {
                type: string;
                description: string;
                optional: boolean;
            };
            name: {
                type: string;
                description: string;
                optional: boolean;
            };
            category?: undefined;
            service?: undefined;
        };
        required?: undefined;
    };
} | {
    name: string;
    description: string;
    parameters: {
        type: string;
        properties: {
            service: {
                type: string;
                description: string;
                optional: boolean;
            };
            name: {
                type: string;
                description: string;
                optional: boolean;
            };
            category?: undefined;
            technology?: undefined;
        };
        required?: undefined;
    };
})[];
/**
 * Execute a tool by name with the given parameters
 */
export declare function executeToolByName(name: string, params?: any): Promise<{
    content: {
        type: "text";
        text: string;
    }[];
}[]>;
