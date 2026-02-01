import { mkdir, rm } from "fs/promises";
import {
  CommonAPI,
  CommonAPIPaths,
  CommonAPIResolvers,
  SiteGeneratorAPI,
} from "#swooce";
import {
  resolvePageTargetRoutePath,
  StandardStaticSiteGenerator,
  resolvePageTargetFileAsboluteURL,
} from "#@swooce/standard";

import MySiteFactory from "../src/site.ts";

// determine project paths
const MY_SITE_TARGET_DIR_PATH = "../dist/";
const mySiteSrcDirAbsoluteURL = new URL("../src/", import.meta.url);
const myPagesSrcDirAbsoluteURL = new URL("../src/pages/", import.meta.url);
const mySiteTargetDirAbsoluteUrl = new URL(
  MY_SITE_TARGET_DIR_PATH,
  import.meta.url,
);
const commonPaths = {
  siteSrcDirAbsoluteURL: mySiteSrcDirAbsoluteURL,
  pagesSrcDirAbsoluteURL: myPagesSrcDirAbsoluteURL,
  pagesTargetDirAbsoluteURL: mySiteTargetDirAbsoluteUrl,
} satisfies CommonAPIPaths;
const commonResolvers = {
  resolvePageTargetRoutePath: resolvePageTargetRoutePath,
  resolvePageTargetFileAsboluteURL: resolvePageTargetFileAsboluteURL,
} satisfies CommonAPIResolvers;
const commonApi: CommonAPI = {
  resolvers: commonResolvers,
  paths: commonPaths,
};

// create site
const mySiteFactory = new MySiteFactory();
const mySite = await mySiteFactory.create(commonApi);

// ensure clean generation target directory
await rm(mySiteTargetDirAbsoluteUrl, { recursive: true });
await mkdir(mySiteTargetDirAbsoluteUrl);

// generate site (emit static site files with client-side hydration to target directory)
const siteGeneratorApi = {
  paths: commonPaths,
  resolvers: commonResolvers,
} satisfies SiteGeneratorAPI;
const standardSiteGenerator = new StandardStaticSiteGenerator(mySite);
await standardSiteGenerator.generate(siteGeneratorApi);
