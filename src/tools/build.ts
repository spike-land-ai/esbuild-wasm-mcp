import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { BuildOptions } from "@spike-land-ai/esbuild-wasm";

import { getEsbuildWasm } from "../wasm-api.js";
import { formatErrorResponse } from "../errors.js";
import {
  BuildOnlySchema,
  CommonSchema,
  prepareBuildOptions,
} from "./schemas.js";

const BuildSchema = { ...BuildOnlySchema, ...CommonSchema };

export function registerBuildTool(server: McpServer): void {
  server.tool(
    "esbuild_wasm_build",
    "Bundle entry point files using esbuild-wasm. Returns output contents in memory (does not write to disk by default).",
    BuildSchema,
    async args => {
      const esbuild = await getEsbuildWasm();

      try {
        const opts = prepareBuildOptions(args);
        const options = { ...opts } as BuildOptions;
        options.bundle = options.bundle ?? true;
        options.write = options.write ?? false;

        const result = await esbuild.build(options);

        const output: Record<string, unknown> = {
          outputFiles: (result.outputFiles ?? []).map(f => ({
            path: f.path,
            text: f.text,
          })),
          warnings: result.warnings,
          errors: result.errors,
        };
        if (result.metafile) output.metafile = result.metafile;
        if (result.mangleCache) output.mangleCache = result.mangleCache;

        return {
          content: [{
            type: "text",
            text: JSON.stringify(output, null, 2),
          }],
        };
      } catch (err: unknown) {
        return formatErrorResponse(err);
      }
    },
  );
}
