import { describe, expect, it, vi } from "vitest";
import { registerBuildTool } from "./build.js";
import { registerContextTool } from "./context.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const mockEsbuild = vi.hoisted(() => ({
  build: vi.fn(),
  context: vi.fn(),
}));

vi.mock("../wasm-api.js", () => ({
  getEsbuildWasm: vi.fn().mockResolvedValue(mockEsbuild),
}));

class MockMcpServer {
  tools = new Map<string, any>();

  tool(
    name: string,
    description: string,
    schema: Record<string, unknown>,
    handler: (args: any) => Promise<any>,
  ) {
    this.tools.set(name, handler);
  }
}

describe("esbuild_wasm_mcp tools", () => {
  it("build tool provides defaults for bundle and write", async () => {
    const server = new MockMcpServer();
    registerBuildTool(server as unknown as McpServer);

    const handler = server.tools.get("esbuild_wasm_build");
    expect(handler).toBeDefined();

    mockEsbuild.build.mockResolvedValue({
      outputFiles: [{ path: "out.js", text: "console.log('test')" }],
      warnings: [],
      errors: [],
    });

    await handler!({
      entryPoints: ["in.js"],
    });

    expect(mockEsbuild.build).toHaveBeenCalledWith(
      expect.objectContaining({
        entryPoints: ["in.js"],
        bundle: true,
        write: false,
      }),
    );
  });

  it("context tool provides defaults for bundle and write", async () => {
    const server = new MockMcpServer();
    registerContextTool(server as unknown as McpServer);

    const handler = server.tools.get("esbuild_wasm_context");
    expect(handler).toBeDefined();

    const mockCtx = {
      rebuild: vi.fn().mockResolvedValue({
        outputFiles: [{ path: "out.js", text: "console.log('test')" }],
        warnings: [],
        errors: [],
      }),
      dispose: vi.fn().mockResolvedValue(undefined),
    };
    mockEsbuild.context.mockResolvedValue(mockCtx);

    await handler!({
      entryPoints: ["in.js"],
    });

    expect(mockEsbuild.context).toHaveBeenCalledWith(
      expect.objectContaining({
        entryPoints: ["in.js"],
        bundle: true,
        write: false,
      }),
    );
    expect(mockCtx.rebuild).toHaveBeenCalled();
    expect(mockCtx.dispose).toHaveBeenCalled();
  });

  it("build tool handles metafile and mangleCache", async () => {
    const server = new MockMcpServer();
    registerBuildTool(server as unknown as McpServer);
    const handler = server.tools.get("esbuild_wasm_build");

    mockEsbuild.build.mockResolvedValue({
      outputFiles: [],
      warnings: [],
      errors: [],
      metafile: { inputs: {}, outputs: {} },
      mangleCache: { a: "b" },
    });

    const result = await handler!({ entryPoints: ["in.js"] });
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.metafile).toBeDefined();
    expect(parsed.mangleCache).toBeDefined();
  });

  it("build tool handles errors", async () => {
    const server = new MockMcpServer();
    registerBuildTool(server as unknown as McpServer);
    const handler = server.tools.get("esbuild_wasm_build");

    mockEsbuild.build.mockRejectedValue(new Error("Build failed"));
    const result = await handler!({ entryPoints: ["in.js"] });
    expect(result.isError).toBe(true);
  });
});
