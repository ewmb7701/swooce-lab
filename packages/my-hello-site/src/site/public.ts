import { FactoryGlobArtifactResolver, VoidArtifact } from "@swooce/core";

export default FactoryGlobArtifactResolver(
  import.meta.url,
  "./public/*",
  (artifactSrcFileURL) => new VoidArtifact(artifactSrcFileURL),
);
