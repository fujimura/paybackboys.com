import Nano, { h } from "nano-jsx";
import * as Papa from "papaparse";

// https://docs.google.com/spreadsheets/d/1M9tmpu_hkLYeFzn1tM2nqc68GEGiVj8q2F4LJVS1VyU/edit#gid=1124112482
const SPREADSHEET_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTs1ndgRVWLD8zf8IntYmq_Gd86CUcvC-MAq37sLMQ1oB1HAXpSlfumo42bb7GvwxwvWJQwns8pQs8V/pub?gid=0&single=true&output=csv";

export interface Env {}

type Show = {
  date: string;
  venue: string;
};

const App = ({ shows }: { shows: Show[] }) => {
  return (
    <div>
      <h1>Hello!</h1>
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

const f = async (
  request: Request,
  env: Env,
  ctx: ExecutionContext
): Promise<Response> => {
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
  console.log(csv);

  const app = Nano.renderSSR(<App shows={shows} />);
  const html = render(app);

  return new Response(html, {
    headers: {
      "content-type": "text/html;charset=UTF-8",
    },
  });
};

export default { fetch: f };
