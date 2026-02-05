import { Writable } from "node:stream";

type ArtifactRoute = string;

interface IArtifact {
  readonly route: ArtifactRoute;
}

class Artifact implements IArtifact {
  readonly route: ArtifactRoute;

  constructor(route: ArtifactRoute) {
    this.route = route;
  }
}

type ArtifactWriter<TArtifact> = (
  siteContext: ISiteContext,
  artifact: TArtifact,
  artifactTargetWritable: Writable,
) => Promise<void>;

type ArtifactResolver<TResolvedArtifact> = (
  siteContext: ISiteContext,
) => Promise<Array<TResolvedArtifact>>;

interface IArtifactProducer {
  resolve(ctx: ISiteContext): Promise<IArtifact[]>;
  write(
    ctx: ISiteContext,
    artifact: IArtifact,
    artifactTargetWritable: Writable,
  ): Promise<void>;
}

interface ArtifactProducer<
  TArtifact extends Artifact,
> extends IArtifactProducer {
  resolve(ctx: ISiteContext): Promise<TArtifact[]>;
  write(
    ctx: ISiteContext,
    artifact: TArtifact,
    artifactTargetWritable: Writable,
  ): Promise<void>;
}

/**
 * Site-wide context shared between all primitives, like project paths and resolvers.
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

  /**
   * Get the route of an artifact using the src file URL of the artifact.
   */
  getArtifactRouteUsingSrcFileURL: (artifactSrcFileURL: URL) => ArtifactRoute;
}

interface ISite {
  readonly artifactProducer: Array<IArtifactProducer>;
}

export {
  Artifact,
  type IArtifact,
  type ArtifactRoute,
  type ArtifactResolver,
  type ArtifactWriter,
  type IArtifactProducer,
  type ArtifactProducer,
  type ISite,
  type ISiteContext,
};
