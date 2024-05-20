import { serveFile } from "jsr:@std/http/file-server";
import { typeByExtension } from "https://deno.land/std@0.224.0/media_types/mod.ts";
import { extname } from "https://deno.land/std@0.224.0/path/mod.ts";


const handler = async (req: Request): Promise<Response> => {
    let path = new URL(req.url).pathname;
    const url = new URL(req.url);
    console.log("Method:", req.method);
    console.log("Path:", url.pathname);
    console.log("Query parameters:", url.searchParams);
    console.log("Headers:", req.headers);

    if (req.body) {
        const body = await req.text();
        console.log("Body:", body);
    }
    if (path.endsWith("/")) { path += "index.html"; }
    const filePath = path === "/" ? "./index.html" : `.${path}`;
    const ext = extname(filePath);
    const webxrpath = `./webxr${path}`

    try {
        const response = await serveFile(req, webxrpath);
        const contentType = typeByExtension(ext) || "application/octet-stream";
        response.headers.set("content-type", contentType);
        return response;
    } catch (ex) {
        if (ex.name === "NotFound") { return new Response("Not Found", { status: 404 }); }
        return new Response("Internal Server Error", { status: 500 });
    }
};
const cert = await Deno.readTextFile("./cert.pem");
const key = await Deno.readTextFile("./key.pem");
const port = 443;
const options = {
    hostname: "0.0.0.0",
    port: port,
    cert: cert,
    key: key,
};
console.log(`HTTPS server running. Access it at: https://localhost:${port}/`);
Deno.serve(options, handler);

//#region http redirect
const redirectToHttps = async (req: Request): Promise<Response> => {
const url = new URL(req.url);
const httpsUrl = `https://${url.hostname}${url.port ? `:${url.port}` : ''}${url.pathname}`;
return new Response(null, {
    status: 301,
    headers: {
    "Location": httpsUrl,
    },
});
};

const httpPort = 80;
  
console.log(`HTTP server running. Redirecting all requests to HTTPS.`);
Deno.serve( { hostname: "0.0.0.0", port: httpPort }, redirectToHttps,);
//#endregion