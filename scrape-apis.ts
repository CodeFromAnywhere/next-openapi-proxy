import path from "path";
import fs from "node:fs";
import {
  OpenapiDocument,
  fetchOpenapi,
  mapMany,
  notEmpty,
  oneByOne,
} from "from-anywhere";
import { writeJsonToFile } from "from-anywhere/node";
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

  const list = await fetch("https://api.apis.guru/v2/list.json").then(
    (res) => res.json() as Promise<ApiObject>,
  );

  const parsedList = Object.keys(list)
    .map((key) => {
      const latestVersion = Object.keys(list[key].versions).sort().pop();

      if (!latestVersion) {
        return;
      }

      const version = list[key].versions[latestVersion];

      const originalUrl = version.info["x-origin"]
        // Only index openapis for now
        .filter((x) => x.format === "openapi")
        .pop()?.url;

      if (!originalUrl) {
        return;
      }

      // Key must be good for subdomain
      const realKey = key
        .replaceAll("(", "-")
        .replaceAll(")", "-")
        .replaceAll(":", "-")
        .replaceAll(".", "-")
        .toLowerCase();

      return {
        key: realKey,
        originalUrl,
        title: version.info.title,
        // description: version.info.description,
      };
    })
    .filter(notEmpty);

  console.log("Writing list", parsedList.length);

  const downloadedKeys = (
    await mapMany(
      parsedList,
      async (item, index) => {
        console.log(`${index + 1}/${parsedList.length}`);
        const downloaded = await fetchOpenapi(item.originalUrl);

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
          "x-origin-servers": downloaded.servers,
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
  const filteredList = parsedList.filter((x) => downloadedKeys.includes(x.key));
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
