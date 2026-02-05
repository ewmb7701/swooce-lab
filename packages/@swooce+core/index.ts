import { copyFile, mkdir } from "node:fs/promises";
import { dirname, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { glob } from "glob";
import type { Artifact, ArtifactResolver, PipelineContext } from "swooce";

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
 * Creates an artifact resolver which resolves artifacts from matching files
 * using a given factory.
 */
function createFactoryGlobArtifactResolver<T extends Artifact>(
  baseDirURL: URL,
  pattern: string,
  artifactFactory: (artifactSrcFileURL: URL) => T,
): ArtifactResolver<Artifact> {
  return async (_ctx) => {
    const matches = await glob(pattern, {
      cwd: baseDirURL,
      nodir: true,
      posix: true,
      dotRelative: true,
    });

    return matches.map((relativePath) =>
      artifactFactory(new URL(relativePath, baseDirURL)),
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
function createDynamicGlobArtifactResolver(
  baseDirURL: URL,
  pattern: string,
): ArtifactResolver<Artifact> {
  return async (ctx) => {
    const matches = await glob(pattern, {
      cwd: baseDirURL,
      nodir: true,
      posix: true,
      dotRelative: true,
    });

    const artifacts: Artifact[] = [];

    for (const relativePath of matches) {
      const resolverModuleURL = new URL(relativePath, baseDirURL);

      const resolverModule = await import(fileURLToPath(resolverModuleURL));

      const resolveArtifact =
        resolverModule.default as ArtifactResolver<Artifact>;

      const resolved = await resolveArtifact(ctx);

      if (Array.isArray(resolved)) {
        artifacts.push(...resolved);
      } else {
        artifacts.push(resolved);
      }
    }

    return artifacts;
  };
}

/**
 * Artifact emitter which copies the artifact src file to its target file path.
 */
async function emitFileArtifactViaCopy(
  ctx: PipelineContext,
  artifact: Artifact,
) {
  console.log(
    `CopyFileArtifactEmitter will emit artifact ${artifact.srcFileURL}`,
  );

  const targetFileURL = ctx.getArtifactTargetFileURL(ctx, artifact);
  const targetFileDir = `${dirname(fileURLToPath(targetFileURL))}${sep}`;

  await mkdir(targetFileDir, { recursive: true });
  await copyFile(artifact.srcFileURL, targetFileURL);

  console.log(
    `CopyFileArtifactEmitter did emit artifact ${artifact.srcFileURL} -> ${targetFileURL}`,
  );
}

export {
  emitFileArtifactViaCopy,
  createDynamicGlobArtifactResolver,
  createFactoryGlobArtifactResolver,
  type IArtifactWithSrcFileContent,
};
