import { existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));

export async function resolve(specifier, context, nextResolve) {
  if (specifier === "server-only") {
    return {
      format: "module",
      shortCircuit: true,
      url: "data:text/javascript,export default {};",
    };
  }

  let candidateUrl = null;

  if (specifier.startsWith("@/")) {
    const relativePath = specifier.slice(2);
    const candidatePath = join(projectRoot, relativePath);
    if (existsSync(candidatePath + ".ts")) {
      candidateUrl = pathToFileURL(candidatePath + ".ts").href;
    } else if (existsSync(candidatePath + ".tsx")) {
      candidateUrl = pathToFileURL(candidatePath + ".tsx").href;
    } else if (existsSync(candidatePath + "/index.ts")) {
      candidateUrl = pathToFileURL(join(candidatePath, "index.ts")).href;
    } else if (existsSync(candidatePath)) {
      candidateUrl = pathToFileURL(candidatePath).href;
    }
  }

  if (candidateUrl) {
    return nextResolve(candidateUrl, context);
  }

  try {
    return await nextResolve(specifier, context);
  } catch (err) {
    if (
      (err.code === "ERR_MODULE_NOT_FOUND" || err.code === "ERR_UNSUPPORTED_DIR_IMPORT") &&
      context.parentURL &&
      context.parentURL.startsWith("file:")
    ) {
      try {
        const urlWithTs = new URL(specifier + ".ts", context.parentURL);
        if (existsSync(fileURLToPath(urlWithTs))) {
          return nextResolve(urlWithTs.href, context);
        }
      } catch {}
      try {
        const urlWithTsx = new URL(specifier + ".tsx", context.parentURL);
        if (existsSync(fileURLToPath(urlWithTsx))) {
          return nextResolve(urlWithTsx.href, context);
        }
      } catch {}
      try {
        const urlWithIndex = new URL(specifier + "/index.ts", context.parentURL);
        if (existsSync(fileURLToPath(urlWithIndex))) {
          return nextResolve(urlWithIndex.href, context);
        }
      } catch {}
    }
    throw err;
  }
}
