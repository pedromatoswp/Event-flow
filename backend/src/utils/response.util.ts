import type { Response } from "express";

export function sendOk<T>(res: Response, data: T) {
  res.status(200).json({
    success: true,
    data
  });
}

export function sendCreated<T>(res: Response, data: T) {
  res.status(201).json({
    success: true,
    data
  });
}

