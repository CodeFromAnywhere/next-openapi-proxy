import { OpenapiDocument, mergeObjectsArray } from "from-anywhere";
import { readJsonFile } from "from-anywhere/node";
import { existsSync } from "fs";
import path from "path";

export const handleRequest = async (request: Request, method: string) => {
  const url = request.url;
  const urlObject = new URL(url);
  const pathname = urlObject.pathname;

  const [tld, domain, subdomain] = urlObject.hostname.split(".").reverse();

  const key =
    urlObject.hostname === "localhost"
      ? process.env.LOCALHOST_TEST_KEY
      : subdomain || domain;

  const openapiPath = path.resolve(".", "public", key + ".json");

  const hasOpenapi = existsSync(openapiPath);
  // setting for allow-all cors
  const defaultResponseInit = {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      // "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  };

  if (!hasOpenapi) {
    return Response.json(
      {
        message: `Invalid domain.`,
        openapiPath,
      },
      defaultResponseInit,
    );
  }

  const openapi = await readJsonFile<OpenapiDocument>(openapiPath);
  if (!openapi?.paths) {
    return Response.json(
      {
        message: `Failed to read.`,
        openapiPath,
      },
      defaultResponseInit,
    );
  }

  const operation = (openapi as any).paths?.[pathname]?.[method] as
    | undefined
    | {};

  if (!operation) {
    const allowedMethods = [
      "get",
      "post",
      "put",
      "patch",
      "delete",
      "head",
      "options",
    ];
    const methods = mergeObjectsArray(
      Object.keys(openapi.paths).map((path) => {
        return {
          [path]: Object.keys((openapi as any).paths[path]).filter((method) =>
            allowedMethods.includes(method),
          ),
        };
      }),
    );

    return Response.json(
      {
        message: `Invalid method. More info at ${urlObject.origin}/${key}.json`,
        methods,
        openapiPath,
      },
      defaultResponseInit,
    );
  }

  const originalServerUrl = (openapi.info as any)?.["x-origin"]?.find(
    (x: any) => x.format === "server",
  )?.url as string | undefined;

  if (!originalServerUrl) {
    return Response.json(
      {
        message: `Original server could not be found`,
      },
      defaultResponseInit,
    );
  }

  const fullOriginalUrl =
    originalServerUrl + pathname + urlObject.search + urlObject.hash;

  console.log(`FOUND ORIGINAL URL`, fullOriginalUrl);

  const result = await fetch(fullOriginalUrl, {
    method,
    body: request.body,
    headers: request.headers,
  }).then((res) => res.json());

  return Response.json(result, defaultResponseInit);
};
