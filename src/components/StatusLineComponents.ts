/**
 * Container for all status line components
 */

import type { WorkDir } from "./WorkDir.ts";
import type { GitInfo } from "./GitInfo.ts";
import type { ModelInfo } from "./ModelInfo.ts";
import type { ContextInfo } from "./ContextInfo.ts";
import type { Config } from "../types.ts";
import { PREDEFINED_LAYOUTS } from "../types.ts";

export class StatusLineComponents {
  constructor(
    public readonly workDir: WorkDir,
    public readonly git: GitInfo,
    public readonly model: ModelInfo,
    public readonly context: ContextInfo,
    public readonly config?: Config
  ) {}

  render(): string {
    const animationOptions = {
      animated: this.config?.animations?.enabled ?? false,
      spinnerStyle: this.config?.animations?.spinner,
    };

    // Component map for flexible rendering
    const componentMap: Record<string, string> = {
      project: this.workDir.renderProject(),
      cwd: this.workDir.renderCwd(),
      git: this.git.render(),
      model: this.model.render(),
      context: this.context.render(animationOptions),
    };

    // Resolve layout (predefined or custom)
    const layout = this.resolveLayout();

    // Build each line by parsing component names from layout strings
    const lines = layout.map((lineSpec) => {
      const componentNames = lineSpec.trim().split(/\s+/);
      const lineParts = componentNames
        .map((name) => componentMap[name])
        .filter((part) => part); // Filter out undefined/empty
      return lineParts.join(" ");
    });

    return lines.join("\n");
  }

  private resolveLayout(): string[] {
    const configLayout = this.config?.["render-layout"];

    // If no layout configured, use default (layout-1-line)
    if (!configLayout) {
      return PREDEFINED_LAYOUTS["layout-1-line"];
    }

    // If it's a string (predefined layout name), resolve it
    if (typeof configLayout === "string") {
      return PREDEFINED_LAYOUTS[configLayout as keyof typeof PREDEFINED_LAYOUTS] || PREDEFINED_LAYOUTS["layout-1-line"];
    }

    // Otherwise it's a custom array
    return configLayout;
  }
}
