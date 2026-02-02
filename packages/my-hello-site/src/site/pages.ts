import { ImportGlobArtifactResolver } from "@swooce/core";

export default ImportGlobArtifactResolver(import.meta.url, "./pages/*.ts");
