import { DyamicGlobArtifactResolver } from "@swooce/core";

export default DyamicGlobArtifactResolver(import.meta.url, "./pages/*.ts");
