import { mkdir, rm } from "fs/promises";
import { HelloSiteEmitter, createHelloSiteAPI } from "@swooce/site-hello";

import MySiteModuleResolver from "../src/site.ts";

const api = createHelloSiteAPI(new URL("../", import.meta.url));

// create site
const mySiteModuleResolver = new MySiteModuleResolver();
const mySiteModule = await mySiteModuleResolver.resolve(api);

try {
  await rm(api.paths.targetDirURL, { recursive: true, force: true });
} catch (error) {}
await mkdir(api.paths.targetDirURL);

// generate site
const helloSiteEmitter = new HelloSiteEmitter();
await helloSiteEmitter.emit(api, mySiteModule);
