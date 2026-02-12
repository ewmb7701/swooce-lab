import { Readable, Writable } from "node:stream";

type ArtifactRoute = string;

interface IArtifact {
  readonly route: ArtifactRoute;
  readonly mimeType: string | null;
}

class Artifact implements IArtifact {
  readonly route: ArtifactRoute;
  readonly mimeType: string | null;

  constructor(route: ArtifactRoute, mimeType: string | null) {
    this.route = route;
    this.mimeType = mimeType;
  }
}

type ArtifactReader<TArtifact> = (
  siteContext: ISiteContext,
  artifact: TArtifact,
) => Promise<Readable>;

type ArtifactWriter<TArtifact> = (
  siteContext: ISiteContext,
  artifact: TArtifact,
  artifactSrcReadable: Readable,
  artifactTargetWritable: Writable,
) => Promise<void>;

type ArtifactFinder<TFinddArtifact> = (
  siteContext: ISiteContext,
) => Promise<Array<TFinddArtifact>>;

interface IArtifactProducer {
  scan(ctx: ISiteContext): Promise<ReadonlyArray<IArtifact>>;
  read(ctx: ISiteContext, artifact: IArtifact): Promise<Readable>;
  write(
    ctx: ISiteContext,
    artifact: IArtifact,
    artifactSrcReadable: Readable,
    artifactTargetWritable: Writable,
  ): Promise<void>;
}

/**
 * Site-wide context shared between all primitives, like project paths and finders.
 *
 * Provided to all primitives.
 */
interface ISiteContext {
  /**
   * The absolute URL of the project directory.
   *
   * eg, "file:///home/eric/projects/my-cool-website/"
   */
  readonly projectDirURL: URL;

  /**
   * The absolute URL of the source directory.
   *
   * eg, "file:///home/eric/projects/my-cool-website/src/"
   */
  readonly srcDirURL: URL;

  /**
   * The absolute URL of the target directory.
   *
   * eg, "file:///home/eric/projects/my-cool-website/dist/"
   *
   * By convention:
   * - path of ./dist
   */
  readonly targetDirURL: URL;
}

interface ISite {
  readonly artifactProducer: Array<IArtifactProducer>;
}

interface ISiteIndexEntry {
  readonly artifact: IArtifact;
  readonly producer: IArtifactProducer;
}

interface ISiteIndex {
  readonly entriesByRoute: Record<ArtifactRoute, ISiteIndexEntry>;
}

async function createSiteIndex(
  ctx: ISiteContext,
  site: Readonly<ISite>,
): Promise<ISiteIndex> {
  const entries = (
    await Promise.all(
      site.artifactProducer.map(async (producer) => {
        const artifacts = await producer.scan(ctx);

        const iiSiteIndexEntry = artifacts.map(
          (artifact) =>
            [
              artifact.route,
              {
                artifact,
                producer,
              } as const satisfies ISiteIndexEntry,
            ] as const,
        );

        return iiSiteIndexEntry;
      }),
    )
  ).flat();

  return {
    entriesByRoute: Object.fromEntries(entries),
  };
}

export {
  Artifact,
  type IArtifact,
  type ArtifactRoute,
  type ArtifactFinder,
  type ArtifactWriter,
  type ArtifactReader,
  type IArtifactProducer,
  type ISite,
  type ISiteIndex,
  type ISiteIndexEntry,
  type ISiteContext,
  createSiteIndex,
};
