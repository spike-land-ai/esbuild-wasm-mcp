import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { TransformOptions } from "@spike-land-ai/esbuild-wasm";
import { getEsbuildWasm } from "../wasm-api.js";
import { formatErrorResponse } from "../errors.js";
import {
  CommonSchema,
  prepareBuildOptions,
  TransformOnlySchema,
} from "./schemas.js";

const TransformSchema = { ...TransformOnlySchema, ...CommonSchema };

export function registerTransformTool(server: McpServer): void {
  server.tool(
    "esbuild_wasm_transform",
    "Transform source code (TypeScript, JSX, CSS, etc.) to JavaScript or CSS using esbuild-wasm",
    TransformSchema,
    async args => {
      const esbuild = await getEsbuildWasm();

      try {
        const rawOpts = prepareBuildOptions(args);
        const code = rawOpts.code as string;
        const { code: _code, ...rest } = rawOpts;
        const transformOpts: TransformOptions = {
          loader: "ts",
          ...rest as TransformOptions,
        };

        const result = await esbuild.transform(code, transformOpts);

        const output: Record<string, unknown> = {
          code: result.code,
          warnings: result.warnings,
        };
        if (result.map) output.map = result.map;
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
