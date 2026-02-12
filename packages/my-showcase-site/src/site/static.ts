import { Readable } from "node:stream";
import { fileURLToPath } from "node:url";
import { createReadStream } from "node:fs";
import { relative as posixRelative } from "node:path/posix";
import { lookup as getMimeType } from "mime-types";
import { type IArtifactProducer, type ISiteContext } from "swooce";
import {
  ArtifactWithSrcFile,
  scanGlobViaFactory,
  writeViaPipeline,
} from "@swooce/core";

class StaticArtifact extends ArtifactWithSrcFile {}

async function scan(siteContext: ISiteContext) {
  return scanGlobViaFactory(
    "./src/site/static/**/*",
    siteContext.projectDirURL,
    (srcFileURL) => {
      const srcFilePath = fileURLToPath(srcFileURL);
      const route = `/${posixRelative(`${siteContext.projectDirURL.href}/src/site/static/`, srcFileURL.href)}`;
      const mimeType = getMimeType(srcFilePath) || null;

      return new StaticArtifact(route, mimeType, srcFileURL);
    },
  );
}

async function read(
  _siteContext: ISiteContext,
  artifact: StaticArtifact,
): Promise<Readable> {
  const readable = createReadStream(artifact.srcFileURL);

  return readable;
}

const producer = {
  scan,
  read,
  write: writeViaPipeline,
} satisfies IArtifactProducer;

export { scan, read, producer, producer as default };
