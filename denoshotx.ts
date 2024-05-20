import puppeteer from "https://deno.land/x/puppeteer@16.2.0/mod.ts";
import { Buffer } from "https://deno.land/std@0.224.0/io/buffer.ts";

async function captureFrames(url:string, frameHandler: FrameHandlerType) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(url, {
    waitUntil: 'networkidle2',
  });

  async function capture() {
    const buffer = await page.screenshot({ encoding: 'binary' });
    await frameHandler(buffer);
  }

  // Capture frames in a loop
  while (true) {
    await capture();
    await new Promise(resolve => setTimeout(resolve, 1000 / 90)); // Adjust for 30 FPS
  }
}

type FrameHandlerType = (buffer: Buffer) => void;
// Example frame handler that just logs the buffer length
async function frameHandler(buffer:Buffer) {
  console.log('Captured frame of length:', buffer.length);
}
const url = "https://example.com";

captureFrames(url, frameHandler);