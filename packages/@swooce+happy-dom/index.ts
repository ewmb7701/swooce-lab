import { writeFile, mkdir } from "fs/promises";
import { dirname } from "path";
import { fileURLToPath } from "url";
import type { Document } from "happy-dom";
import type { PipelineContext } from "swooce";
import { ContentArtifact, ContentArtifactEmitter } from "@swooce/core";

/**
 * {@link ContentArtifactEmitter} for artifacts with content of {@link Document}.
 */
export class DocumentContentArtifactEmitter extends ContentArtifactEmitter<
  ContentArtifact<Document>
> {
  protected async writeContent(
    ctx: PipelineContext,
    artifact: ContentArtifact<Document>,
    content: Document,
  ) {
    const targetFileURL = ctx.paths.resolveArtifactTargetFileURL(ctx, artifact);
    const targetFilePath = fileURLToPath(targetFileURL);
    const targetDir = dirname(targetFilePath);

    // ensure directory exists
    await mkdir(targetDir, { recursive: true });

    // write the HTML content
    await writeFile(targetFileURL, content.documentElement.outerHTML, "utf-8");
  }

  constructor() {
    super();
  }
}
