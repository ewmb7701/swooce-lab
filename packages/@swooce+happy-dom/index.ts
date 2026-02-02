import { writeFile, mkdir } from "fs/promises";
import { dirname } from "path";
import { fileURLToPath } from "url";
import type { Document } from "happy-dom";
import type { Context } from "swooce";
import { ContentModule, ContentModuleEmitter } from "@swooce/core";

/**
 * ContentModuleEmitter for modules whose content is a `Document`.
 * Automatically writes the document to its target file using outerHTML.
 */
export class DocumentContentModuleEmitter extends ContentModuleEmitter<
  ContentModule<Document>
> {
  /**
   * Writes the content of the module to disk.
   */
  protected async writeContent(
    ctx: Context,
    module: ContentModule<Document>,
    content: Document,
  ) {
    const targetFileURL = ctx.paths.resolveModuleTargetFileURL(ctx, module);
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
