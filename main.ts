import { emptyDir } from 'https://deno.land/std@0.182.0/fs/mod.ts';
import { resolve, fromFileUrl, join } from "https://deno.land/std@0.182.0/path/mod.ts";
import { DOMParser } from 'https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts';
import { serve } from 'https://deno.land/std@0.182.0/http/server.ts';

const __dirname = new URL('.', import.meta.url).pathname;
const publicDir = './public';

await build();
if (Deno.args.indexOf('serve') > -1) server();

async function build () {
  const index = await Deno.readTextFile('./index.html');
  const styles = await Deno.readTextFile('./styles.css');
  const script = await Deno.readTextFile('./script.js');

  const document = new DOMParser().parseFromString(index, 'text/html');
  if (!document) return;
  if (!document.documentElement) return;

  const styleElement = document.querySelector('#styles');
  const scriptElement = document?.querySelector('#script');

  if (styleElement) {
    const prefix = styleElement.innerHTML;
    styleElement.innerHTML = styles.replace(/^|\n(?!\s*$)/g, prefix + '  ').replace(/(\n?\s*$/, prefix);
  }
  if (scriptElement) {
    const prefix = scriptElement.innerHTML;
    scriptElement.innerHTML = script.replace(/^|\n(?!\s*$)/g, prefix + '  ').replace(/(\n?\s*$/, prefix);
  }

  await emptyDir(publicDir);
  await Deno.writeTextFile(join(publicDir, 'index.html'), document.documentElement.outerHTML);
}

async function server () { console.log('SERVE!!!');
  const port = 8888;

  const handler = async (request: Request): Promise<Response> => {
    const { pathname } = new URL(request.url);
    const path = join(__dirname, publicDir, pathname);

    try {
      return new Response(await Deno.readFile(path), { status: 200 });
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        console.log(`File not found: ${pathname}`);
        return new Response('404 — File not found', { status: 200 });
      }
      throw error;
    }
  };
  
  console.log(`HTTP webserver running. Access it at: http://localhost:${port}/`);
  serve(handler, { port });
}