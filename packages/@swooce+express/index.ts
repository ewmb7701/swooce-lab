import type { NextFunction, Request, Response } from "express";
import { type ISiteIndex, type ISiteContext } from "swooce";

function createMiddleware(siteContext: ISiteContext, siteIndex: ISiteIndex) {
  return async function swooceMiddleware(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const route = req.path;

    const entry = siteIndex.entriesByRoute[route];
    if (!entry) {
      next();
      return;
    }

    const { artifact, producer } = entry;

    try {
      res.status(200);
      if (artifact.mimeType !== null) {
        res.setHeader("Content-Type", artifact.mimeType);
      }
      await producer.write(siteContext, artifact, res);
      res.end();
    } catch (err) {
      next(err);
    }
  };
}

export { createMiddleware };
