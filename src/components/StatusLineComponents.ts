/**
 * Container for all status line components
 */

import type { WorkDir } from "./WorkDir.ts";
import type { GitInfo } from "./GitInfo.ts";
import type { ModelInfo } from "./ModelInfo.ts";
import type { ContextInfo } from "./ContextInfo.ts";
import type { Config } from "../types.ts";

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
    };

    const parts: string[] = [
      this.workDir.render(),
      this.git.render(),
      this.model.render(),
      this.context.render(animationOptions),
    ];

    return parts.join(" ");
  }
}
