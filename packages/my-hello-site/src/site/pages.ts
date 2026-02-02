import { MetaGlobModuleResolver } from "@swooce/core";

export default MetaGlobModuleResolver(import.meta.url, "./pages/*.ts");
