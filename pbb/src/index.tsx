import Nano, { h } from "nano-jsx";
import * as Papa from "papaparse";
import { getAssetFromKV } from "@cloudflare/kv-asset-handler";
import { KVError } from "@cloudflare/kv-asset-handler/dist/types";

// @ts-ignore
import manifestJSON from "__STATIC_CONTENT_MANIFEST";
const assetManifest = JSON.parse(manifestJSON);

const ASSET_PATH = "/public/";

// https://docs.google.com/spreadsheets/d/1M9tmpu_hkLYeFzn1tM2nqc68GEGiVj8q2F4LJVS1VyU/edit#gid=1124112482
const SPREADSHEET_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTs1ndgRVWLD8zf8IntYmq_Gd86CUcvC-MAq37sLMQ1oB1HAXpSlfumo42bb7GvwxwvWJQwns8pQs8V/pub?gid=0&single=true&output=csv";

export interface Env {
  __STATIC_CONTENT: any;
}

type Show = {
  date: string;
  venue: string;
};

const App = ({ shows }: { shows: Show[] }) => {
  return (
    <div>
      <h1>Hello!</h1>
      <img src="./public/logo.jpg" />
      <ul>
        {shows.map((show) => (
          <li>{show.date}</li>
        ))}
      </ul>
    </div>
  );
};

const render = (body: string): string => `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body>
    ${body}
  </body>
</html>
`;

type Handler = (
  request: Request,
  env: Env,
  ctx: ExecutionContext
) => Promise<Response | null>;

const index: Handler = async (request, env, ctx) => {
  const url = new URL(request.url);
  if (url.pathname != "/") return null;

  const csv = await (await fetch(SPREADSHEET_CSV_URL)).text();
  const shows: Show[] = Papa.parse(csv)
    // @ts-ignore
    .data.filter(([date]) => {
      // Show today's show
      return new Date(Date.parse(date) + 24 * 60 * 60 * 1000) > new Date();
    })
    // @ts-ignore
    .map(([date, venue]) => {
      return { date: date, venue: venue };
    });

  const app = Nano.renderSSR(<App shows={shows} />);
  const html = render(app);

  return new Response(html, {
    headers: {
      "content-type": "text/html;charset=UTF-8",
    },
  });
};

const assets: Handler = async (request, env, ctx) => {
  const url = new URL(request.url);

  if (!url.pathname.startsWith(ASSET_PATH)) return null;

  url.pathname = url.pathname.replace(ASSET_PATH, "");

  try {
    return await getAssetFromKV(
      {
        request: new Request(url.toString(), request),
        waitUntil: (p) => ctx.waitUntil(p),
      },
      {
        ASSET_NAMESPACE: env.__STATIC_CONTENT,
        ASSET_MANIFEST: assetManifest,
      }
    );
  } catch (e) {
    if (e instanceof KVError) {
      return new Response(e.message, { status: e.status });
    } else {
      throw e; // TODO
    }
  }
};

const f = async (
  request: Request,
  env: Env,
  ctx: ExecutionContext
): Promise<Response> => {
  const run = (h: Handler) => h(request, env, ctx);

  for (const h of [assets, index]) {
    const res = await run(h);
    if (res) return res;
  }

  return new Response("Not Found", { status: 404 });
};

export default { fetch: f };
