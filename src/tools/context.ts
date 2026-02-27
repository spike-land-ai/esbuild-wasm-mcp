import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { BuildOptions } from "@spike-land-ai/esbuild-wasm";

import { getEsbuildWasm } from "../wasm-api.js";
import { formatErrorResponse } from "../errors.js";
import {
  BuildOnlySchema,
  CommonSchema,
  prepareBuildOptions,
} from "./schemas.js";

const ContextSchema = { ...BuildOnlySchema, ...CommonSchema };

export function registerContextTool(server: McpServer): void {
  server.tool(
    "esbuild_wasm_context",
    "Create an esbuild-wasm context for incremental builds. Returns the build result. The context is disposed after use.",
    ContextSchema,
    async args => {
      const esbuild = await getEsbuildWasm();

      try {
        const opts = prepareBuildOptions(args);
        const options = { ...opts } as BuildOptions;
        options.bundle = options.bundle ?? true;
        options.write = options.write ?? false;

        const ctx = await esbuild.context(options);

        try {
          const result = await ctx.rebuild();
          const output: Record<string, unknown> = {
            outputFiles: (result.outputFiles ?? []).map(f => ({
              path: f.path,
              text: f.text,
            })),
            warnings: result.warnings,
            errors: result.errors,
          };
          if (result.mangleCache) output.mangleCache = result.mangleCache;

          return {
            content: [{
              type: "text",
              text: JSON.stringify(output, null, 2),
            }],
          };
        } finally {
          await ctx.dispose();
        }
      } catch (err: unknown) {
        return formatErrorResponse(err);
      }
    },
  );
}
