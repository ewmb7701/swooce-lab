import { copyFile, mkdir, rm } from "node:fs/promises";
import { dirname, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { glob } from "glob";
import {
  type IArtifact,
  type ArtifactResolver,
  type ISiteContext,
  Artifact,
  type ArtifactRoute,
  type ISite,
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
  fetchSrcContent(siteContext: ISiteContext): Promise<TSrcContent>;
}

class SrcFileArtifact
  extends Artifact
  implements IArtifact, IArtifactWithSrcFile
{
  readonly srcFileURL: URL;

  constructor(route: ArtifactRoute, srcFileURL: URL) {
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
  getCwdURL: (siteContext: ISiteContext) => URL,
  artifactFactory: (siteContext: ISiteContext, srcFileURL: URL) => T,
): ArtifactResolver<T> {
  return async (siteContext) => {
    const cwd = getCwdURL(siteContext);

    const matches = await glob(pattern, {
      cwd: cwd,
      nodir: true,
      posix: true,
      dotRelative: true,
    });

    return matches.map((relativePath) =>
      artifactFactory(siteContext, new URL(relativePath, cwd)),
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
  getCwdURL: (siteContext: ISiteContext) => URL,
): ArtifactResolver<TResolveArtifact> {
  return async (siteContext) => {
    const cwd = getCwdURL(siteContext);

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

      const resolvedArtifact = await resolveArtifact(siteContext);

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
  siteContext: ISiteContext,
  artifact: IArtifact & IArtifactWithSrcFile,
) {
  const srcFileURL = artifact.srcFileURL;

  const targetFileURL = siteContext.getArtifactTargetFileURL(artifact);
  const targetFileDir = `${dirname(fileURLToPath(targetFileURL))}${sep}`;

  await mkdir(targetFileDir, { recursive: true });
  await copyFile(srcFileURL, targetFileURL);
}

async function buildSite(
  siteContext: ISiteContext,
  site: ISite,
): Promise<void> {
  await rm(siteContext.targetDirURL, { recursive: true, force: true });
  await mkdir(siteContext.targetDirURL, { recursive: true });

  for (const iArtifactProducer of site.artifactProducer) {
    const iResolvedArtifact = await iArtifactProducer.resolve(siteContext);

    if (Array.isArray(iResolvedArtifact)) {
      for (const iiResolvedArtifact of iResolvedArtifact) {
        await iArtifactProducer.emit(siteContext, iiResolvedArtifact);
      }
    } else {
      await iArtifactProducer.emit(siteContext, iResolvedArtifact);
    }
  }
}

export {
  SrcFileArtifact,
  buildSite,
  emitArtifactSrcFileViaCopy,
  createDynamicGlobArtifactResolver,
  createFactoryGlobArtifactResolver,
  type IArtifact,
  type IArtifactWithSrcFile,
  type IArtifactWithSrcContent,
};
