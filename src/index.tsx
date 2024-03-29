import { h, Fragment, renderSSR } from "nano-jsx";
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
      <img src="./public/logo.jpg" alt="Payback Boys" />
      <h2>Upcoming shows</h2>
      <dl class="live-date">
        {shows.map(({ date, venue }) => (
          <Fragment key={date}>
            <dt>{date}</dt>
            <dd>{venue}</dd>
          </Fragment>
        ))}
      </dl>
      <iframe
        style="border: 0; width: 350px; height: 555px;"
        src="https://bandcamp.com/EmbeddedPlayer/album=1870396252/size=large/bgcol=ffffff/linkcol=0687f5/transparent=true/"
        seamless
      >
        <a href="https://wdsounds.bandcamp.com/album/payback-boys-invisible-moments">
          PAYBACK BOYS &quot;INVISIBLE MOMENTS&quot; by PAYBACK BOYS
        </a>
      </iframe>
    </div>
  );
};

const render = (body: string): string => `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Payback Boys</title>
    <meta name="description" content="TOKYO STRAIGHT UP HARDCORE">
    <meta name="author" content="Payback Boys">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="apple-touch-icon" sizes="57x57" href="/public/apple-icon-57x57.png">
    <link rel="apple-touch-icon" sizes="60x60" href="/public/apple-icon-60x60.png">
    <link rel="apple-touch-icon" sizes="72x72" href="/public/apple-icon-72x72.png">
    <link rel="apple-touch-icon" sizes="76x76" href="/public/apple-icon-76x76.png">
    <link rel="apple-touch-icon" sizes="114x114" href="/public/apple-icon-114x114.png">
    <link rel="apple-touch-icon" sizes="120x120" href="/public/apple-icon-120x120.png">
    <link rel="apple-touch-icon" sizes="144x144" href="/public/apple-icon-144x144.png">
    <link rel="apple-touch-icon" sizes="152x152" href="/public/apple-icon-152x152.png">
    <link rel="apple-touch-icon" sizes="180x180" href="/public/apple-icon-180x180.png">
    <link rel="icon" type="image/png" sizes="192x192"  href="/public/android-icon-192x192.png">
    <link rel="icon" type="image/png" sizes="32x32" href="/public/favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="96x96" href="/public/favicon-96x96.png">
    <link rel="icon" type="image/png" sizes="16x16" href="/public/favicon-16x16.png">
    <link rel="manifest" href="/public/manifest.json">
    <meta name="msapplication-TileColor" content="#ffffff">
    <meta name="msapplication-TileImage" content="/public/ms-icon-144x144.png">
    <meta name="theme-color" content="#ffffff">
  <style>
    #root {
      text-align: center;
      max-width: 500px;
      margin: 0 auto;
    }
    #root ul {
      list-style-type: none;
        padding: 0;
    }
    dl.live-date {
      display: flex;
      flex-wrap: wrap;
      margin-right: 5px;
      font-weight: bold;
    }
    .live-date dt {
      box-sizing: border-box;
      width: 50%;
      margin: 0;
      text-align: right;
      padding-right: 1em;
    }
    .live-date dd {
      box-sizing: border-box;
      width: 50%;
      margin: 0;
      text-align: left;
    }
  </style>
  </head>
  <body>
    <div id="root">
    ${body}
    </div>
  </body>
</html>
`;

type Handler = (
  request: Request,
  env: Env,
  ctx: ExecutionContext
) => Promise<Response | null>;

// TODO: Handle request with query parameters
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

  const app = renderSSR(<App shows={shows} />);
  const html = render(app);

  return new Response(html, {
    headers: {
      "content-type": "text/html;charset=UTF-8",
    },
  });
};

// TODO: Handle request with query parameters
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

// TODO: Handle request with query parameters
const rootObjects: Handler = async (request, env, ctx) => {
  const url = new URL(request.url);

  if (
    !["/browserconfig.xml", "/manifest.json", "/favicon.ico"].includes(
      url.pathname
    )
  )
    return null;

  return await getAssetFromKV(
    {
      request,
      waitUntil: (p) => ctx.waitUntil(p),
    },
    {
      ASSET_NAMESPACE: env.__STATIC_CONTENT,
      ASSET_MANIFEST: assetManifest,
    }
  );
};

const f = async (
  request: Request,
  env: Env,
  ctx: ExecutionContext
): Promise<Response> => {
  const run = (h: Handler) => h(request, env, ctx);

  for (const h of [assets, index, rootObjects]) {
    const res = await run(h);
    if (res) return res;
  }

  return new Response("Not Found", { status: 404 });
};

export default { fetch: f };
