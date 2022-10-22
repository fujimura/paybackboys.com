import Nano, { h } from "nano-jsx";

export interface Env {}

const App = () => {
  return (
    <div>
      <h1>Hello!</h1>
    </div>
  );
};

const app = Nano.renderSSR(<App />);

const html = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body>
    ${app}
  </body>
</html>
`;

const fetch = async (
  request: Request,
  env: Env,
  ctx: ExecutionContext
): Promise<Response> => {
  return new Response(html, {
    headers: {
      "content-type": "text/html;charset=UTF-8",
    },
  });
};

export default { fetch };
