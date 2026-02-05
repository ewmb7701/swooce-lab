type Route = string;

interface IArtifact {
  readonly route: Route;
}

class Artifact implements IArtifact {
  readonly route: Route;

  constructor(route: Route) {
    this.route = route;
  }
}

type ArtifactEmitter<TEmitArtifact extends IArtifact> = (
  ctx: PipelineContext,
  artifact: TEmitArtifact,
) => Promise<void>;

type ArtifactResolver<TResolvedArtifact extends IArtifact> = (
  ctx: PipelineContext,
) => Promise<Array<TResolvedArtifact>>;

/**
 * Site-wide context shared between all primitives, like project paths and resolvers.
 *
 * Provided to all primitives.
 */
interface PipelineContext {
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
  getArtifactRouteUsingSrcFileURL: (artifactSrcFileURL: URL) => Route;

  /**
   * Get the absolute target URL of an artifact.
   *
   * eg, from `file:///home/eric/projects/my-cool-website/src/site/pages/posts/post-1.md` to `file:///home/eric/projects/my-cool-website/target/post-1.md.html`.
   */
  getArtifactTargetFileURL: (artifact: IArtifact) => URL;
}

type Pipeline<TPipelineContext extends PipelineContext> = (
  ctx: TPipelineContext,
) => Promise<void>;

export {
  Artifact,
  type IArtifact,
  type Route,
  type ArtifactResolver,
  type ArtifactEmitter,
  type Pipeline,
  type PipelineContext,
};
