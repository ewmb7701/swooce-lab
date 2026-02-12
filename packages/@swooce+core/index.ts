import { Readable, type Writable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { dirname } from "node:path";
import { createWriteStream } from "node:fs";
import { mkdir, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { glob } from "glob";
import {
  Artifact,
  type IArtifact,
  type ArtifactRoute,
  type ArtifactWriter,
  type ISiteContext,
  type ISite,
  type ArtifactReader,
  type IArtifactProducer,
} from "swooce";

interface IArtifactWithSrcFile {
  /**
   * Absolute URL of the source file of this artifact.
   *
   * eg,`/home/eric/projects/my-cool-website/src/site/pages/posts/reasons-im-cool.md`
   */
  readonly srcFileURL: URL;
}

class ArtifactWithSrcFile
  extends Artifact
  implements IArtifact, IArtifactWithSrcFile
{
  readonly srcFileURL: URL;

  constructor(route: ArtifactRoute, mimeType: string | null, srcFileURL: URL) {
    super(route, mimeType);
    this.srcFileURL = srcFileURL;
  }
}

async function scanGlobViaFactory<IArtifact>(
  pattern: string,
  cwd: string | URL,
  artifactFactory: (srcFileURL: URL) => IArtifact,
): Promise<ReadonlyArray<IArtifact>> {
  const matches = await glob(pattern, {
    cwd: cwd,
    nodir: true,
    posix: true,
    dotRelative: true,
  });

  const artifact = matches.map((relativePath) =>
    artifactFactory(new URL(relativePath, cwd)),
  );

  return Promise.resolve(artifact);
}

/**
 * Creates an artifact finder which finds artifacts from matching files
 * via dynamic import.
 *
 * The matching files must be ES modules with an ArtifactFinder
 * as the default export.
 */
async function produceGlobViaImport(
  pattern: string,
  cwd: URL,
): Promise<ReadonlyArray<IArtifactProducer>> {
  const matches = await glob(pattern, {
    cwd: cwd,
    nodir: true,
    posix: true,
    dotRelative: true,
  });

  const artifacts: IArtifactProducer[] = [];

  for (const relativePath of matches) {
    const finderModuleURL = new URL(relativePath, cwd);
    const finderModule = await import(fileURLToPath(finderModuleURL));

    const findArtifact = finderModule.default as IArtifactProducer;

    artifacts.push(findArtifact);
  }

  return Promise.resolve(artifacts);
}

async function writeViaPipeline(
  _siteContext: ISiteContext,
  _artifact: IArtifact,
  artifactSrcReadable: Readable,
  artifactTargetWritable: Writable,
) {
  await pipeline(artifactSrcReadable, artifactTargetWritable);
}

async function writeArtifactToFs<TArtifact extends IArtifact>(
  siteContext: ISiteContext,
  artifact: TArtifact,
  readArtifact: ArtifactReader<TArtifact>,
  writeArtifact: ArtifactWriter<TArtifact>,
) {
  const artifactTargetFileURL = new URL(
    `.${artifact.route}`,
    `${siteContext.targetDirURL}`,
  );
  const artifactTargetFileDir = `${dirname(fileURLToPath(artifactTargetFileURL))}`;
  await mkdir(artifactTargetFileDir, { recursive: true });

  const artifactSrcReadable = await readArtifact(siteContext, artifact);
  const artifactTargetWritable = createWriteStream(artifactTargetFileURL);
  await writeArtifact(
    siteContext,
    artifact,
    artifactSrcReadable,
    artifactTargetWritable,
  );
}

async function writeSiteToFs(
  siteContext: ISiteContext,
  site: ISite,
): Promise<void> {
  await rm(siteContext.targetDirURL, { recursive: true, force: true });
  await mkdir(siteContext.targetDirURL, { recursive: true });

  for (const iArtifactProducer of site.artifactProducer) {
    const iFindArtifact = await iArtifactProducer.scan(siteContext);

    for (const iiFindArtifact of iFindArtifact) {
      await writeArtifactToFs(
        siteContext,
        iiFindArtifact,
        iArtifactProducer.read,
        iArtifactProducer.write,
      );
    }
  }
}

export {
  ArtifactWithSrcFile,
  writeSiteToFs,
  writeViaPipeline,
  scanGlobViaFactory,
  produceGlobViaImport,
  type IArtifact,
  type IArtifactWithSrcFile,
};
