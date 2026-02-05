class Artifact {
  /**
   * Absolute URL of the source file of this artifact.
   *
   * eg,`/home/eric/projects/my-cool-website/src/document/posts/reasons-im-cool.md`
   */
  readonly srcFileURL: URL;

  constructor(srcFileURL: URL) {
    this.srcFileURL = srcFileURL;
  }
}

type ArtifactEmitter<TArtifact extends Artifact = Artifact> = (
  ctx: PipelineContext,
  artifact: TArtifact,
) => Promise<void>;

type ArtifactResolver<TArtifact extends Artifact = Artifact> = (
  ctx: PipelineContext,
) => Promise<TArtifact | Array<TArtifact>>;

/**
 * Site-wide context shared between all primitives, like project paths and resolvers.
 *
 * Provided to all primitives.
 */
interface PipelineContext<TArtifact extends Artifact = Artifact> {
  /**
   * The absolute URL of the site project directory.
   *
   * eg, "file:///home/eric/projects/my-cool-website/"
   */
  readonly projectDirURL: URL;

  /**
   * The absolute URL of the site source directory.
   *
   * eg, "file:///home/eric/projects/my-cool-website/src/"
   */
  readonly srcDirURL: URL;

  /**
   * The absolute URL of the document target directory.
   *
   * eg, "file:///home/eric/projects/my-cool-website/dist/"
   *
   * By convention:
   * - path of ./dist
   */
  readonly targetDirURL: URL;

  /**
   * Get the route of an artifact using the artifact src file URL.
   */
  getArtifactRoute: (ctx: this, artifactSrcFileURL: URL) => string;

  /**
   * Get the absolute target URL of an artifact.
   *
   * eg, from `file:///home/eric/projects/my-cool-website/src/document/posts/post-1.md` to `file:///home/eric/projects/my-cool-website/target/document/posts/post-1.md`.
   */
  getArtifactTargetFileURL: (ctx: this, artifact: TArtifact) => URL;

  getArtifactEmitter: (
    ctx: this,
    artifact: TArtifact,
  ) => ArtifactEmitter<TArtifact>;
}

type Pipeline<
  TPipelineContext extends PipelineContext<TArtifact>,
  TArtifact extends Artifact = Artifact,
> = (ctx: TPipelineContext) => Promise<void>;

export {
  Artifact,
  type ArtifactResolver,
  type ArtifactEmitter,
  type Pipeline,
  type PipelineContext,
};
