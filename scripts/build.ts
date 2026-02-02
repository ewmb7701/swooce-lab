import { mkdir, rm } from "fs/promises";
import { API, APIPaths } from "#swooce";
import { staticSiteResolvers, StaticSiteEmitter } from "#@swooce/standard";

import MySiteFactory from "../src/site.ts";

// determine project paths
const MY_SITE_TARGET_DIR_PATH = "../dist/";
const mySiteSrcDirURL = new URL("../src/", import.meta.url);
const myDocumentSrcDirURL = new URL("../src/documents/", import.meta.url);
const mySiteTargetDirAbsoluteUrl = new URL(
  MY_SITE_TARGET_DIR_PATH,
  import.meta.url,
);
const apiPaths = {
  siteSrcDirURL: mySiteSrcDirURL,
  documentSrcDirURL: myDocumentSrcDirURL,
  documentTargetDirURL: mySiteTargetDirAbsoluteUrl,
} satisfies APIPaths;
const apiResolvers = staticSiteResolvers;
const api: API = {
  resolvers: apiResolvers,
  paths: apiPaths,
};

// create site
const mySiteFactory = new MySiteFactory();
const mySiteSrc = await mySiteFactory.create(api);

// ensure clean generation target directory
await rm(mySiteTargetDirAbsoluteUrl, { recursive: true });
await mkdir(mySiteTargetDirAbsoluteUrl);

// generate site (emit static site files with client-side hydration to target directory)
const staticSiteEmitter = new StaticSiteEmitter();
await staticSiteEmitter.emit(api, mySiteSrc);
