/**
 * cPanel "Setup Node.js App" এর জন্য startup file।
 * Application startup file: server.js
 *
 * লোকাল/VPS-এ `npm start` (next start) ব্যবহার করুন; এটি শুধু Passenger-এর জন্য।
 */
const { createServer } = require("node:http");
const next = require("next");

const port = Number(process.env.PORT || 3000);
const hostname = process.env.HOSTNAME || "0.0.0.0";
const app = next({ dev: false, dir: __dirname });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    createServer((req, res) => handle(req, res)).listen(port, hostname, () => {
      console.log(`▲ mdabutaher.com ready on http://${hostname}:${port}`);
    });
  })
  .catch((error) => {
    console.error("Next.js startup failed", error);
    process.exit(1);
  });
