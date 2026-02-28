# @spike-land-ai/esbuild-wasm-mcp

Model Context Protocol (MCP) server for `esbuild-wasm` transpilation. This server provides tools to transpile TypeScript/JavaScript code using `esbuild-wasm`, making it useful for AI agents and browser-based development environments.

## Features

- Fast transpilation using `esbuild-wasm`.
- Supports TypeScript, JSX, and TSX.
- Optimized for MCP clients.

## Installation

```bash
yarn install
```

## Build

```bash
yarn build
```

## Usage

### Development

```bash
yarn dev
```

### Start Server

```bash
yarn start
```

## Integration

To use this with an MCP client (like Claude Desktop), add it to your configuration:

```json
{
  "mcpServers": {
    "esbuild-wasm": {
      "command": "node",
      "args": ["/path/to/packages/esbuild-wasm-mcp/dist/index.js"]
    }
  }
}
```
