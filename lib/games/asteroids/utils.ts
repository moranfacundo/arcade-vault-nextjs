import { H, W } from "./constants";

export const wrapX = (v: number) => ((v % W) + W) % W;
export const wrapY = (v: number) => ((v % H) + H) % H;
export const dist = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.hypot(a.x - b.x, a.y - b.y);
export const rand = (min: number, max: number) => min + Math.random() * (max - min);
export const randInt = (min: number, max: number) => Math.floor(rand(min, max + 1));
