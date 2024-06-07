import { OpenapiDocument } from "from-anywhere";
import { readJsonFile } from "from-anywhere/node";
import { existsSync } from "fs";
import path from "path";

export const handleOpenapiRequest = async (request: Request) => {
  const url = request.url;
  const urlObject = new URL(url);

  const openapiId = urlObject.pathname.split("/")[1];

  console.log({ url, openapiId });

  const openapiPath = path.resolve(".", "public", openapiId + ".json");

  const hasOpenapi = existsSync(openapiPath);

  console.log({ openapiPath, hasOpenapi });
  if (!hasOpenapi) {
    return Response.json("Not found", { status: 404 });
  }

  const defaultResponseInit = {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  };

  const openapi = await readJsonFile<OpenapiDocument>(openapiPath);

  return Response.json(openapi, defaultResponseInit);
};
