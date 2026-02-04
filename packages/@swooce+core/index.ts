import { copyFile, mkdir } from "node:fs/promises";
import { dirname, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { glob } from "glob";
import {
  Artifact,
  ArtifactEmitter,
  ArtifactResolver,
  type PipelineContext,
} from "swooce";

/**
 * Artifact with src file content.
 */
interface IArtifactWithSrcFileContent<TSrcContent> {
  /**
   * Fetch the content of the src file of this artifact.
   */
  fetchSrcFileContent(ctx: PipelineContext): Promise<TSrcContent>;
}

/**
 * Creates an artifact resolver which resolves artifacts from matching files using a given factory.
 */
function FactoryGlobArtifactResolver<T extends Artifact>(
  baseDirURL: URL,
  pattern: string,
  artifactFactory: (artifactSrcFileURL: URL) => T,
) {
  return class extends ArtifactResolver<T> {
    override async resolve(_ctx: any): Promise<T[]> {
      const matches = await glob(pattern, {
        cwd: baseDirURL,
        nodir: true,
        posix: true,
        dotRelative: true,
      });

      // Map each match into an artifact using the factory
      return matches.map((relativePath) =>
        artifactFactory(new URL(relativePath, baseDirURL)),
      );
    }
  };
}

/**
 * Creates an artifact resolver which resolves artifacts from matching files via dynamic import.
 *
 * The matching files must be ES modules with an artifact resolver as the default export.
 */
function DyamicGlobArtifactResolver(baseDirURL: URL, pattern: string) {
  return class extends ArtifactResolver<Artifact> {
    override async resolve(ctx: PipelineContext): Promise<Artifact[]> {
      const matches = await glob(pattern, {
        cwd: baseDirURL,
        nodir: true,
        posix: true,
        dotRelative: true,
      });

      const artifact: Artifact[] = [];
      for (const relativePath of matches) {
        const artifactResolverModuleFileURL = new URL(relativePath, baseDirURL);

        // import artifact resolver module
        const artifactResolverModule = await import(
          fileURLToPath(artifactResolverModuleFileURL)
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
 * Implements `emit` as fetch -> transform -> write.
 */
abstract class ContentArtifactEmitter<
  TArtifact extends Artifact & IArtifactWithSrcFileContent<TSrcContent>,
  TSrcContent = unknown,
  TTargetContent = unknown,
> extends ArtifactEmitter<TArtifact> {
  /**
   * Transform the fetched src content to target content before writing.
   *
   * You may apply minification, bundling, etc here.
   */
  abstract transform(
    _ctx: PipelineContext,
    _artifact: TArtifact,
    srcFileContent: TSrcContent,
  ): Promise<TTargetContent>;

  /**
   * Writes the transformed content of the artifact to the disk at the resolved target URL.
   */
  protected abstract writeTargetFileContent(
    ctx: PipelineContext,
    artifact: TArtifact,
    targetFileContent: TTargetContent,
  ): Promise<void>;

  async emit(ctx: PipelineContext, artifact: TArtifact): Promise<void> {
    console.log(
      `ContentArtifactEmitter will emit ${artifact.constructor.name} from ${artifact.srcFileURL}`,
    );

    const srcContent = await artifact.fetchSrcFileContent(ctx);
    const targetContent = await this.transform(ctx, artifact, srcContent);
    await this.writeTargetFileContent(ctx, artifact, targetContent);

    console.log(
      `ContentArtifactEmitter did emit ${artifact.constructor.name} from ${artifact.srcFileURL}`,
    );
  }
}

/**
 * Artifact emitter which copies the artifact src file to its target file path.
 *
 * The target file path is resolved using {@link PipelineContext}.
 */
class CopyFileArtifactEmitter extends ArtifactEmitter<Artifact> {
  async emit(ctx: PipelineContext, artifact: Artifact): Promise<void> {
    console.log(
      `CopyArtifactEmitter will emit artifact ${artifact.srcFileURL}`,
    );

    const targetFileURL = ctx.getArtifactTargetFileURL(ctx, artifact);
    const targetFileDir = `${dirname(fileURLToPath(targetFileURL))}${sep}`;

    await mkdir(targetFileDir, { recursive: true });
    await copyFile(artifact.srcFileURL, targetFileURL);

    console.log(
      `CopyArtifactEmitter did emit artifact ${artifact.srcFileURL} -> ${targetFileURL}`,
    );
  }

  constructor() {
    super();
  }
}

export {
  type IArtifactWithSrcFileContent,
  ContentArtifactEmitter,
  CopyFileArtifactEmitter,
  DyamicGlobArtifactResolver,
  FactoryGlobArtifactResolver,
};
