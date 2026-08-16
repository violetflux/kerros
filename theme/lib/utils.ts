/**
 * Vendored from beUI Motion (https://beui.dev) — MIT License
 * Copyright (c) 2026 Saurabh Chauhan — https://github.com/starc007/ui-components
 * Upstream source: https://beui.dev/r/text-reveal/raw (registry lib/utils.ts)
 * Copied verbatim; no behavioral changes.
 */
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
