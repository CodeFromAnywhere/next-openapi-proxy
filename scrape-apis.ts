import path from "path";
import fs from "node:fs";
import {
  OpenapiDocument,
  fetchOpenapi,
  humanCase,
  mapMany,
  notEmpty,
  oneByOne,
  slugify,
} from "from-anywhere";
import { readJsonFile, writeJsonToFile } from "from-anywhere/node";

const hardcodedItemObject = {
  flyio: "https://docs.machines.dev/spec/openapi3.json",
  heygen: "https://openai-plugin.heygen.com/openapi.yaml",
  replicate: "https://api.replicate.com/openapi.json",
  vapi: "https://api.vapi.ai/api-json",
  klippa: "https://dochorizon.klippa.com/api/open-api.yaml",
  // deepgram: ?????
  uberduck: "https://api.uberduck.ai/openapi.json",
  openai:
    "https://raw.githubusercontent.com/openai/openai-openapi/master/openapi.yaml",
  huggingface: "https://api.endpoints.huggingface.cloud/api-doc/openapi.json",
  cloudflare:
    "https://raw.githubusercontent.com/cloudflare/api-schemas/main/openapi.json",
  twilio: "https://github.com/twilio/twilio-oai/tree/main/spec/json",
  sendgrid:
    "https://raw.githubusercontent.com/sendgrid/sendgrid-oai/main/oai.json",
  linode: "https://www.linode.com/docs/api/openapi.yaml",
  vercel: "https://openapi.vercel.sh/",
  firecrawl:
    "https://raw.githubusercontent.com/mendableai/firecrawl/main/apps/api/openapi.json",
  //(unofficial)
  playht:
    "https://raw.githubusercontent.com/cielo24/playht-openapi/main/playht.yml",
  browserless: "https://docs.browserless.io/redocusaurus/plugin-redoc-0.yaml",
  // NB: as I made it, here it should be exactly how they should've made it.
  serper: "./public/handmade/serper.json",
  doppio: "./public/handmade/doppio.json",
  multion: "./public/handmade/multion.json",
};

const hardcodedList = Object.keys(hardcodedItemObject).map((key) => {
  const uri = hardcodedItemObject[key as keyof typeof hardcodedItemObject];
  const absolutePath =
    uri.startsWith(".") && fs.existsSync(path.join(uri))
      ? path.resolve(uri)
      : undefined;
  const originalUrl = absolutePath ? undefined : uri;

  return {
    key,
    originalUrl,
    absolutePath,
    title: humanCase(key),
  } satisfies OpenapiListItem;
});
export type OpenapiListItem = {
  key: string;
  originalUrl?: string;
  /** Useful for if its here already */
  absolutePath?: string;
  title: string | undefined;
};
/*
- Make a script that:
  - lists all current JSONs in `public`
  - pulls https://api.apis.guru/v2/list.json and reformats it into flat-object array
  - add my own OpenAPI list too besides this.
  - add a unique key for each api
  - change server to `https://[key].dataman.ai`
  - change `x-origin-servers` to `[{url:"original url"}]`
  - puts all `x-origin` openapi urls into `next-openapi-proxy/public` with name `[key].json`
  - add things such as logo and other things they do: https://github.com/APIs-guru/openapi-directory
  - For current JSONs that couldn't be resolved atm, it should add something to the JSON indicating this.
- Confirm the above is possible to host on Vercel (must be <13GB)
- Add an api `/openapiforhumans/list.json` into that proxy repo that responds with all openapi paths.
*/
const scrapeApis = async () => {
  const publicPath = path.resolve(".", "public");

  if (!fs.existsSync(publicPath)) {
    console.log("Public folder not found");
    return;
  }

  const apiObject = await fetch("https://api.apis.guru/v2/list.json").then(
    (res) => res.json() as Promise<ApiObject>,
  );

  const parsedList = Object.keys(apiObject)
    .map((key) => {
      const latestVersion = Object.keys(apiObject[key].versions).sort().pop();

      if (!latestVersion) {
        return;
      }

      const version = apiObject[key].versions[latestVersion];

      const originalUrl = version.info["x-origin"]
        // Only index openapis for now
        .filter((x) => x.format === "openapi")
        .pop()?.url;

      if (!originalUrl) {
        return;
      }

      // Key must be good for subdomain
      const realKey = slugify(key).toLowerCase();

      return {
        key: realKey,
        title: version.info.title,
        originalUrl,
        absolutePath: undefined,
        // description: version.info.description,
      } satisfies OpenapiListItem;
    })
    .filter(notEmpty);

  const fullList = hardcodedList.concat(parsedList);

  console.log(
    "Writing list",
    parsedList.length,
    hardcodedList.length,
    fullList.length,
  );

  const downloadedKeys = (
    await mapMany(
      fullList,
      async (item, index) => {
        console.log(`${index + 1}/${fullList.length}`);
        const downloaded = item.absolutePath
          ? await readJsonFile<OpenapiDocument>(item.absolutePath)
          : await fetchOpenapi(item.originalUrl);

        if (!downloaded || typeof downloaded === "string") {
          return;
        }
        if (JSON.stringify(downloaded).length > 1024 * 1024 * 10) {
          return;
        }
        if (JSON.stringify(downloaded).length < 400) {
          return;
        }

        if (!downloaded.servers || downloaded.servers.length === 0) {
          return;
        }

        const switchedServers = {
          ...downloaded,
          //@ts-ignore
          "x-origin-servers": downloaded.servers.map((x) => {
            const absoluteUrl =
              x.url.startsWith("/") && item.originalUrl
                ? new URL(item.originalUrl).origin + x.url
                : x.url;

            if (x.url.startsWith("/")) {
              console.log(
                `[${item.key}.json]: apispec from ${item.originalUrl} server stars with slash: ${x.url}... should become ${absoluteUrl}... `,
              );
            }
            // NB: support for relative urls by making them absolute if we put the openapi on another server.

            return {
              ...x,
              url: absoluteUrl,
            };
          }),
          servers: [
            {
              description: "Proxy server",
              url: `https://${item.key}.dataman.ai`,
            },
          ],
        } satisfies OpenapiDocument;

        const keyPath = path.join(publicPath, item.key + ".json");

        await writeJsonToFile(keyPath, switchedServers);

        return item.key;
      },
      20,
    )
  ).filter(notEmpty);

  //lists all current JSONs in `public`
  const jsonFilenames = fs
    .readdirSync(publicPath)
    .filter((x) => x.endsWith(".json"));

  console.log({ jsonFiles: jsonFilenames.length });
  const filteredList = fullList.filter((x) => downloadedKeys.includes(x.key));
  await writeJsonToFile(path.join(publicPath, "list.json"), filteredList);
  console.log({ filteredList: filteredList.length });

  //console.log(parsedList);
};
scrapeApis();

type ApiObject = {
  [key: string]: {
    added: string;
    versions: {
      [version: string]: {
        added: string;
        info: {
          contact: {
            "x-twitter"?: string;
          };
          description: string;
          title: string;
          version: string;
          "x-apisguru-categories": string[];
          "x-logo": {
            url: string;
          };
          "x-origin": {
            format: "swagger" | "openapi";
            url: string;
            version?: string;
          }[];

          "x-providerName": string;
          "x-serviceName": string;
        };
        updated: string;
        swaggerUrl: string;
        swaggerYamlUrl: string;
        openapiVer: string;
        link: string;
      };
    };
  };
};
