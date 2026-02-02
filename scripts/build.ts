import { mkdir, rm } from "fs/promises";
import { AstroSiteEmitter, createAstroSiteAPI } from "#@swooce/astro";

import MySiteModuleResolver from "../src/site.ts";

const api = createAstroSiteAPI(new URL("../", import.meta.url));

// create site
const mySiteModuleResolver = new MySiteModuleResolver();
const mySiteModule = await mySiteModuleResolver.resolve(api);

try {
  await rm(api.paths.targetDirURL, { recursive: true, force: true });
} catch (error) {}
await mkdir(api.paths.targetDirURL);

// generate site (emit static site files with client-side hydration to target directory)
const staticSiteEmitter = new AstroSiteEmitter();
await staticSiteEmitter.emit(api, mySiteModule);
