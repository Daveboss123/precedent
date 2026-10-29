import { Config } from '@remotion/cli/config';
import { existsSync } from 'node:fs';

const browser = process.env.REMOTION_BROWSER_EXECUTABLE ?? [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].find((file) => existsSync(file));
if (browser) Config.setBrowserExecutable(browser);

Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(94);
Config.setChromiumOpenGlRenderer('angle');
Config.setConcurrency(4);
Config.setCodec('h264');
Config.setCrf(17);
