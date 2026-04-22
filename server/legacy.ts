import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

export interface LegacyBundle {
  data: Record<string, any>;
  blueprint: string;
}

let cachedBundle: LegacyBundle | null = null;

export function loadLegacyBundle(legacyDir: string, blueprintPath: string): LegacyBundle {
  if (cachedBundle) {
    return cachedBundle;
  }

  const jsDir = path.join(legacyDir, "js");
  const context = {
    console,
    window: {} as Record<string, unknown>,
    WW: {} as Record<string, unknown>
  };

  context.window = context as unknown as typeof context.window;
  vm.createContext(context);

  for (const file of ["data.js", "timeline-data.js"]) {
    const source = fs.readFileSync(path.join(jsDir, file), "utf8");
    vm.runInContext(source, context, { filename: file });
  }

  cachedBundle = {
    data: context.WW as Record<string, any>,
    blueprint: fs.readFileSync(blueprintPath, "utf8")
  };

  return cachedBundle;
}

