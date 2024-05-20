import puppeteer, { Page } from "https://deno.land/x/puppeteer@16.2.0/mod.ts";
import { Buffer } from "https://deno.land/std@0.224.0/io/buffer.ts";
import {installMouseHelper} from "./install-mouse-helper.js";

// Initialize variables outside the functions to keep track of FPS
let frameCount = 0;
let lastTime = Date.now();

async function captureFrames(url: string, frameHandler: FrameHandlerType) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page:Page = await browser.newPage();
  await page.setViewport({
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
  });
  await page.goto(url, {
    waitUntil: 'networkidle2',
  });

  async function capture() {
    const filePath = './screenshot.png';
    await page.screenshot({ path: filePath, type: "png", encoding: "base64" });
    await frameHandler(filePath);
    frameCount++;
  }

  // Example usage: Click at coordinates (450, 450) after a delay
  setTimeout(async () => {
    await clickAt(page, 12, 12);
    //await browser.close();
  }, 2000); // Delay in milliseconds before clicking
  
  // Capture frames in a loop
  while (true) {
    const captureStart = Date.now();
    await capture();
    const captureTime = Date.now() - captureStart;
    const delay = Math.max(0, (1000 / 100) - captureTime); // Adjust for 100 FPS
    await new Promise(resolve => setTimeout(resolve, delay));
  }
}




type FrameHandlerType = (filePath: string) => void;

// Modified frameHandler to calculate and log FPS
async function frameHandler(filePath: string) {
  const currentTime = Date.now();
  const elapsedTime = currentTime - lastTime;
  if (elapsedTime >= 1000) {
    const fps = frameCount / (elapsedTime / 1000); // Calculate FPS
    console.log(`Captured ${fps.toFixed(2)} FPS, saved to ${filePath}`);
    frameCount = 0; // Reset frame count for next calculation
    lastTime = currentTime;
  }
}

async function clickElementById(page: Page, elementId: string) {
  const elementHandle = await page.$(`#${elementId}`);
  if (elementHandle) {
    const boundingBoxResult = await elementHandle.boundingBox();
    if (boundingBoxResult) {
      const x = boundingBoxResult.x;
      const y = boundingBoxResult.y;
      await elementHandle.click();
      console.log(`Clicked on element with ID: ${elementId} at position (${x}, ${y})`);
    } else {
      console.error(`Element with ID "${elementId}" does not have a visible bounding box.`);
    }
  } else {
    console.error(`Element with ID "${elementId}" not found.`);
  }
}

// Function to click at specific coordinates and show the click
async function clickAt(page:Page, x, y) {
  /* await installMouseHelper(page);
  await page.mouse.move(135, 173);
  await page.mouse.down();
  await page.mouse.move(400, 225); */
  await page.mouse.click(x, y);
  //await clickElementById(page, 'pal');
  console.log(`Clicked at (${x}, ${y})`);
  await page.evaluate((x, y) => {
    const marker = document.createElement('div');
    marker.style.position = 'absolute';
    marker.style.top = `${y}px`;
    marker.style.left = `${x}px`;
    marker.style.width = '10px';
    marker.style.height = '10px';
    marker.style.backgroundColor = 'red';
    marker.style.borderRadius = '50%';
    marker.style.zIndex = '10000';
    document.body.appendChild(marker);
    setTimeout(() => marker.remove(), 10000); // Remove the marker after 2 seconds
  }, x, y);
}

const url = "https://www.nyan.cat/";
captureFrames(url, frameHandler);

