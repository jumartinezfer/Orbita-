import type { NextFunction, Request, Response } from "express";

type Handler = (req: Request, res: Response) => Promise<unknown> | unknown;

export function asyncHandler(handler: Handler) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(handler(req, res)).catch(next);
  };
}
