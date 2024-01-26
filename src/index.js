import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';
import configDebug from 'axios-debug-log';
import Listr from 'listr';
import { formatToHyphenCase, ensureAssetsDirectory, extractAssets } from './utilities.js';
import log from './page-loader-debug.js';

configDebug({
  request(debugAxios, config) {
    debugAxios(`Request with ${config.headers['content-type']})`);
  },
  response(debugAxios, response) {
    debugAxios(`Response with ${response.headers['content-type']}`, `from ${response.config.url}`);
  },
  error(debugAxios, error) {
    debugAxios('Boom', error);
  },
});

const downloadAsset = ({ url, filepath }) => axios
  .get(url, { responseType: 'arraybuffer' })
  .then(({ data, status, statusText }) => {
    log('Status:', status, statusText);
    log(`Writting asset to: ${filepath}`);

    return fs.writeFile(filepath, data);
  })
  .catch((e) => console.error(e.message));

const pageLoader = (url, outputDirPath = '') => {
  const pageUrl = new URL(url);
  const { hostname, pathname } = pageUrl;
  const formattedUrl = formatToHyphenCase(`${hostname}${pathname}`);
  const htmlFileName = `${formattedUrl}.html`;
  const htmlFilePath = path.resolve(outputDirPath, htmlFileName);
  const assetsDirName = `${formattedUrl}_files`;
  const assetsDirPath = path.resolve(outputDirPath, assetsDirName);

  log(`Starting page load process for URL: ${url}`);
  log(`HTML file name: ${htmlFileName}`);

  return axios
    .get(url)
    .then(({ data: htmlContent, status, statusText }) => {
      log('Status:', status, statusText);
      log(`Creating assets directory: ${assetsDirPath}`);

      return ensureAssetsDirectory(htmlContent, assetsDirPath);
    })
    .then((htmlContent) => {
      log('Assets directory created successfully');

      const { html, assetsOptions } = extractAssets(
        htmlContent,
        pageUrl,
        assetsDirName,
        outputDirPath,
      );

      const tasks = assetsOptions.map((asset) => ({
        title: asset.url.href,
        task: () => downloadAsset(asset),
      }));

      const taskRun = new Listr(tasks, { concurrent: true });
      const downloadAssetPromises = taskRun.run();

      log(`Writing HTML file to path: ${htmlFilePath}`);

      return Promise.all([fs.writeFile(htmlFilePath, html), downloadAssetPromises])
        .catch((error) => console.error(error.message));
    })
    .then(() => {
      console.log(`Page was successfully downloaded into '${htmlFilePath}'`);
      return htmlFilePath;
    })
    .catch((error) => {
      log(`Error occurred: ${error.message}`);
      console.error(error.message);
      throw error;
    });
};

export default pageLoader;
