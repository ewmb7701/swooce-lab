import { glob } from "glob";
import { copyFile } from "node:fs/promises";
import { dirname } from "node:path/posix";
import {
  Artifact,
  ArtifactEmitter,
  ArtifactResolver,
  type PipelineContext,
} from "swooce";

/**
 * Artifact without any content.
 *
 * Useful for eg, an asset file. Useful when paired with {@link CopyArtifactEmitter}.
 */
export class VoidArtifact extends Artifact {}

/**
 * Artifact with content.
 */
export abstract class ContentArtifact<TContent> extends Artifact {
  /**
   * Fetch the content of the src file of this artifact.
   */
  abstract fetch(ctx: PipelineContext): Promise<TContent>;
}

/**
 * Creates an artifact resolver which resolves artifacts from matching files using a given factory.
 *
 * # Example usage:
 *
 * ## asset folder
 * ```ts
 * export default FactoryGlobArtifactResolver(
 *   import.meta.url,
 *   "./public/*",
 *   (artifactSrcFileURL) => new VoidArtifact(artifactSrcFileURL),
 * );
 *
 * ```
 *
 * ## Dynamic routing
 * ```ts
 * // src/site/page/post.ts
 *
 * // from this src/site/post.ts module, we resolve all src/site/post/*.md as PostPageArtifact
 * export default FactoryGlobArtifactResolver(
 *   import.meta.url,
 *   "./post/*.md",
 *   (url) => new PostPageArtifact(url),
 * );
 * ```
 *
 * @param resolverImportMetaURL `import.meta.url` of the resolver. ie, the `import.meta.url` from the esm file that called this.
 */
export function FactoryGlobArtifactResolver<T extends Artifact>(
  resolverImportMetaURL: string,
  pattern: string,
  artifactFactory: (artifactSrcFileURL: URL) => T,
) {
  return class extends ArtifactResolver<T> {
    override async resolve(_ctx: any): Promise<T[]> {
      const resolverImportMetaDir = `${dirname(resolverImportMetaURL)}/`;

      const matches = await glob(pattern, {
        cwd: resolverImportMetaDir,
        nodir: true,
        posix: true,
        dotRelative: true,
      });

      // Map each match into an artifact using the factory
      return matches.map((relativePath) =>
        artifactFactory(new URL(relativePath, resolverImportMetaURL)),
      );
    }
  };
}

/**
 * Creates an artifact resolver which resolves artifacts from matching files via dynamic import.
 *
 * The matching files must be ES modules with an artifact resolver as the default export.
 *
 * # Example usage:
 *
 * ## Directory sidecar barrel
 * ```ts
 * // src/site/pages.ts
 *
 * // from this src/site/pages.ts module, we resolve modules via dynamic import of all src/site/pages/*.ts modules as artifact resolvers
 * export default DyamicGlobArtifactResolver(import.meta.url, "./pages/*.ts");
 * ```
 *
 * @param resolverImportMetaURL `import.meta.url` of the resolver. ie, the `import.meta.url` from the esm file that called this.
 */
export function DyamicGlobArtifactResolver(
  resolverImportMetaURL: string,
  pattern: string,
) {
  return class extends ArtifactResolver<Artifact> {
    override async resolve(ctx: PipelineContext): Promise<Artifact[]> {
      const resolverImportMetaDir = `${dirname(resolverImportMetaURL)}/`;

      const matches = await glob(pattern, {
        cwd: resolverImportMetaDir,
        nodir: true,
        posix: true,
      });

      const artifact: Artifact[] = [];
      for (const relativePath of matches) {
        const artifactResolverModuleFileURL = new URL(
          relativePath,
          resolverImportMetaDir,
        );

        // import artifact resolver module
        const artifactResolverModule = await import(
          artifactResolverModuleFileURL.href
        );
        const DynamicArtifactResolver =
          artifactResolverModule.default as new () => ArtifactResolver<Artifact>;
        const dynamicArtifactResolverInstance = new DynamicArtifactResolver();

        // Resolve and collect artifacts
        const resolvedArtifact =
          await dynamicArtifactResolverInstance.resolve(ctx);
        if (Array.isArray(resolvedArtifact)) {
          artifact.push(...resolvedArtifact);
        } else {
          artifact.push(resolvedArtifact);
        }
      }

      return artifact;
    }
  };
}

/**
 * Base class which emits content artifacts.
 * Implements `emit` as fetch -> transform -> write.
 *
 * # Usage
 * ```typescript
 * export default class extends
 *
 * ```
 */
export abstract class ContentArtifactEmitter<
  TContentArtifact extends ContentArtifact<TContnet>,
  TContnet = unknown,
> extends ArtifactEmitter<TContentArtifact> {
  /**
   * Optionally transform the fetched content before writing.
   * Override this in subclasses to apply minification, bundling, etc.
   */
  async transform(
    _ctx: PipelineContext,
    content: TContnet,
    _artifact: TContentArtifact,
  ): Promise<TContnet> {
    return content; // default: no-op
  }

  /**
   * Writes the transformed content of the artifact to the disk at the resolved target URL.
   */
  protected abstract writeContent(
    ctx: PipelineContext,
    artifact: TContentArtifact,
    targetContent: TContnet,
  ): Promise<void>;

  async emit(ctx: PipelineContext, artifact: TContentArtifact): Promise<void> {
    console.log(
      `ContentArtifactEmitter will emit artifact ${artifact.srcFileURL}`,
    );

    const srcContent = await artifact.fetch(ctx);
    const targetContent = await this.transform(ctx, srcContent, artifact);
    await this.writeContent(ctx, artifact, targetContent);

    console.log(
      `ContentArtifactEmitter did emit artifact ${artifact.srcFileURL}`,
    );
  }
}

/**
 * Artifact emitter which copies the artifact src file to its target file path.
 *
 * The target file path is resolved using {@link PipelineContext}.
 */
export class CopyArtifactEmitter extends ArtifactEmitter<Artifact> {
  async emit(ctx: PipelineContext, artifact: Artifact): Promise<void> {
    console.log(
      `CopyArtifactEmitter will emit artifact ${artifact.srcFileURL}`,
    );

    const targetFileURL = ctx.paths.resolveArtifactTargetFileURL(ctx, artifact);

    await copyFile(artifact.srcFileURL, targetFileURL);

    console.log(
      `CopyArtifactEmitter did emit artifact ${artifact.srcFileURL} -> ${targetFileURL}`,
    );
  }

  constructor() {
    super();
  }
}
