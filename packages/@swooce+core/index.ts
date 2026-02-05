import { copyFile, mkdir } from "node:fs/promises";
import { dirname, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { glob } from "glob";
import {
  type IArtifact,
  type ArtifactResolver,
  type PipelineContext,
  Artifact,
  type Route,
} from "swooce";

interface IArtifactWithSrcFile {
  /**
   * Absolute URL of the source file of this artifact.
   *
   * eg,`/home/eric/projects/my-cool-website/src/site/pages/posts/reasons-im-cool.md`
   */
  readonly srcFileURL: URL;
}

interface IArtifactWithSrcContent<TSrcContent> {
  /**
   * Fetch the content of the src of this artifact.
   */
  fetchSrcContent(ctx: PipelineContext): Promise<TSrcContent>;
}

class SrcFileArtifact
  extends Artifact
  implements IArtifact, IArtifactWithSrcFile
{
  readonly srcFileURL: URL;

  constructor(route: Route, srcFileURL: URL) {
    super(route);
    this.srcFileURL = srcFileURL;
  }
}

/**
 * Creates an artifact resolver which resolves artifacts from matching files
 * using a given factory.
 */
function createFactoryGlobArtifactResolver<T extends Artifact>(
  pattern: string,
  getCwdURL: (ctx: PipelineContext) => URL,
  artifactFactory: (ctx: PipelineContext, srcFileURL: URL) => T,
): ArtifactResolver<T> {
  return async (ctx) => {
    const cwd = getCwdURL(ctx);

    const matches = await glob(pattern, {
      cwd: cwd,
      nodir: true,
      posix: true,
      dotRelative: true,
    });

    return matches.map((relativePath) =>
      artifactFactory(ctx, new URL(relativePath, cwd)),
    );
  };
}

/**
 * Creates an artifact resolver which resolves artifacts from matching files
 * via dynamic import.
 *
 * The matching files must be ES modules with an ArtifactResolver
 * as the default export.
 */
function createDynamicGlobArtifactResolver<
  TResolveArtifact extends IArtifact = IArtifact,
>(
  pattern: string,
  getCwdURL: (ctx: PipelineContext) => URL,
): ArtifactResolver<TResolveArtifact> {
  return async (ctx) => {
    const cwd = getCwdURL(ctx);

    const matches = await glob(pattern, {
      cwd: cwd,
      nodir: true,
      posix: true,
      dotRelative: true,
    });

    const artifacts: TResolveArtifact[] = [];

    for (const relativePath of matches) {
      const resolverModuleURL = new URL(relativePath, cwd);
      const resolverModule = await import(fileURLToPath(resolverModuleURL));

      const resolveArtifact =
        resolverModule.default as ArtifactResolver<TResolveArtifact>;

      const resolvedArtifact = await resolveArtifact(ctx);

      if (Array.isArray(resolvedArtifact)) {
        artifacts.push(...resolvedArtifact);
      } else {
        artifacts.push(resolvedArtifact);
      }
    }

    return artifacts;
  };
}

/**
 * Artifact emitter which copies the artifact src file to its target file path.
 */
async function emitArtifactSrcFileViaCopy(
  ctx: PipelineContext,
  artifact: IArtifact & IArtifactWithSrcFile,
) {
  const srcFileURL = artifact.srcFileURL;

  const targetFileURL = ctx.getArtifactTargetFileURL(artifact);
  const targetFileDir = `${dirname(fileURLToPath(targetFileURL))}${sep}`;

  await mkdir(targetFileDir, { recursive: true });
  await copyFile(srcFileURL, targetFileURL);
}

export {
  SrcFileArtifact,
  emitArtifactSrcFileViaCopy,
  createDynamicGlobArtifactResolver,
  createFactoryGlobArtifactResolver,
  type IArtifact,
  type IArtifactWithSrcFile,
  type IArtifactWithSrcContent,
};
