import { NextResponse } from "next/server";
import puppeteerCore from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import path from "path";
import os from "os";
import fs from "fs";

function cleanFiveMColorCodes(str: string = ""): string {
  if (!str) return "";
  return str.replace(/\^\d/g, "").trim();
}

interface FiveMScrapeResult {
  rawHostname?: string;
  clients?: number;
  sv_maxclients?: number;
  icon?: string;
  description?: string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID eksik" }, { status: 400 });
  }

  let browser = null;

  try {
    const isVercel = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_VERSION;

    if (isVercel) {
      // Vercel / Serverless Ortamı
      chromium.setHeadlessMode = true;
      chromium.setGraphicsMode = false;

      browser = await puppeteerCore.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(),
        headless: chromium.headless,
      });
    } else {
      // Localhost Ortamı (Bilgisayarındaki indirilen Chrome'u kullanır)
      let chromeExecutablePath = path.join(
        process.cwd(),
        ".cache",
        "puppeteer",
        "chrome",
        "win64-151.0.7922.71",
        "chrome-win64",
        "chrome.exe"
      );

      if (!fs.existsSync(chromeExecutablePath) && os.platform() === "win32") {
        const defaultWinPath = path.join(
          os.homedir(),
          ".cache",
          "puppeteer",
          "chrome",
          "win64-151.0.7922.71",
          "chrome-win64",
          "chrome.exe"
        );
        if (fs.existsSync(defaultWinPath)) {
          chromeExecutablePath = defaultWinPath;
        }
      }

      browser = await puppeteerCore.launch({
        executablePath: chromeExecutablePath,
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--disable-gpu",
        ],
      });
    }

    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"
    );

    const detailUrl = `https://servers.fivem.net/servers/detail/${id}`;
    await page.goto(detailUrl, { waitUntil: "domcontentloaded", timeout: 25000 });

    await new Promise((r) => setTimeout(r, 3000));

    const extractedData: FiveMScrapeResult | null = await page.evaluate(() => {
      const bodyText = document.body.innerText;
      const clientsMatch = bodyText.match(/(\d+)\s*\/\s*(\d+)/);
      let clients = 0;
      let sv_maxclients = 0;

      if (clientsMatch) {
        clients = parseInt(clientsMatch[1], 10);
        sv_maxclients = parseInt(clientsMatch[2], 10);
      }

      let rawHostname = "";
      const selectors = [
        "h1",
        "h2",
        "[class*='serverName']",
        "[class*='hostname']",
        "[class*='title']",
        "header div",
      ];

      for (const selector of selectors) {
        const elements = Array.from(document.querySelectorAll(selector));
        for (const el of elements) {
          const text = el.textContent?.trim() || "";
          if (
            text.length > 3 &&
            !text.includes("Server List") &&
            !text.includes("FiveM Server") &&
            !text.includes("Connect")
          ) {
            rawHostname = text;
            break;
          }
        }
        if (rawHostname) break;
      }

      if (!rawHostname) {
        rawHostname = document.title || "";
      }

      let description = "";
      const scripts = Array.from(document.querySelectorAll('script'));
      for (const script of scripts) {
        const content = script.textContent || "";
        if (content.includes("sv_projectDesc") || content.includes("projectDesc")) {
          const match = content.match(/"sv_projectDesc"\s*:\s*"([^"]+)"/) || 
                        content.match(/"projectDesc"\s*:\s*"([^"]+)"/);
          if (match && match[1]) {
            description = match[1];
            break;
          }
        }
      }

      if (!description) {
        const targetElements = Array.from(
          document.querySelectorAll("p, span, div")
        );

        for (const el of targetElements) {
          const text = el.textContent?.trim() || "";
          const isGenericText = 
            text.includes("Browse thousands of servers") ||
            text.includes("FiveM is a modification") ||
            text.includes("Server List") ||
            text.includes("Connect") ||
            text === rawHostname;

          if (text.length > 2 && !isGenericText) {
            if (
              text.toLowerCase().includes("discord") ||
              text.toLowerCase().includes("fps") ||
              text.toLowerCase().includes("roleplay") ||
              text.toLowerCase().includes("tr") ||
              text.toLowerCase().includes("whitelist")
            ) {
              description = text;
              break;
            }
          }
        }
      }

      const imgElements = Array.from(document.querySelectorAll("img"));
      let iconUrl: string | undefined = undefined;

      for (const img of imgElements) {
        if (
          img.src &&
          (img.src.includes("cfx-services") || img.src.startsWith("data:image"))
        ) {
          iconUrl = img.src;
          break;
        }
      }

      return {
        rawHostname,
        clients,
        sv_maxclients,
        icon: iconUrl,
        description,
      };
    });

    await browser.close();

    const rawHostname = extractedData?.rawHostname || "";
    let cleanName = cleanFiveMColorCodes(rawHostname)
      .replace(/\|.*$/i, "")
      .replace(/- FiveM.*$/i, "")
      .replace(/FiveM Server Detail/i, "")
      .replace(/Server List/i, "")
      .trim();

    if (!cleanName) {
      cleanName = "PWUC Roleplay";
    }

    const cleanDescription = cleanFiveMColorCodes(extractedData?.description || "");

    return NextResponse.json({
      Data: {
        hostname: cleanName,
        clients: extractedData?.clients ?? 0,
        sv_maxclients: extractedData?.sv_maxclients ?? 0,
        icon:
          extractedData?.icon ||
          `https://frontend.cfx-services.net/api/servers/icon/${id}/-543792002.png`,
        vars: {
          sv_projectName: cleanName,
          sv_projectDesc: cleanDescription,
        },
      },
    });
  } catch (error: unknown) {
    if (browser) await browser.close();
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Puppeteer Hatası:", errorMessage);
    return NextResponse.json(
      { error: `Sunucu hatası: ${errorMessage}` },
      { status: 500 }
    );
  }
}