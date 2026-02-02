import { FactoryGlobModuleResolver, VoidModule } from "@swooce/core";

export default FactoryGlobModuleResolver(
  import.meta.url,
  "./public/*.{png,svg}",
  (moduleSrcFileURL) => new VoidModule(moduleSrcFileURL),
);
