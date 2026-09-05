import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);

function parseVersion(version: string): [number, number, number] {
  const match = /^(\d+)\.(\d+)\.(\d+)/.exec(version);
  if (!match) {
    throw new Error(`Unsupported semantic version: ${version}`);
  }

  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

function isAtLeast(
  version: string,
  minimum: [number, number, number]
): boolean {
  const parsed = parseVersion(version);

  for (let index = 0; index < minimum.length; index += 1) {
    if (parsed[index] > minimum[index]) return true;
    if (parsed[index] < minimum[index]) return false;
  }

  return true;
}

describe("dependency upgrade baseline", () => {
  it("keeps the production server on Express 5 or later", () => {
    const expressPackage = require("express/package.json") as {
      version: string;
    };

    expect(isAtLeast(expressPackage.version, [5, 0, 0])).toBe(true);
  });

  it("keeps Qs at or above the patched 6.16.0 release", () => {
    const qsPackage = require("qs/package.json") as { version: string };

    expect(isAtLeast(qsPackage.version, [6, 16, 0])).toBe(true);
  });
});
