import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';
import {
  formatToHyphenCase,
  ensureAssetsDirectory,
  extractAssets,
  downloadAsset,
} from './utilities.js';

const pageLoader = (url, outputDirPath) => {
  const pageUrl = new URL(url);
  const { hostname, pathname } = pageUrl;
  console.log('pathname', pathname);
  const formattedUrl = formatToHyphenCase(`${hostname}${pathname}`);
  const htmlFileName = `${formattedUrl}.html`;
  const htmlFilePath = path.resolve(outputDirPath, htmlFileName);
  const assetsDirName = `${formattedUrl}_files`;
  const assetsDirPath = path.resolve(outputDirPath, assetsDirName);

  return axios
    .get(url)
    .then(({ data: htmlContent }) => ensureAssetsDirectory(htmlContent, assetsDirPath))
    .then((htmlContent) => {
      const { html, assetsOptions } = extractAssets(
        htmlContent,
        pageUrl,
        assetsDirName,
        outputDirPath,
      );
      const downloadAssetsPromises = assetsOptions.map(downloadAsset);

      return Promise.all([fs.writeFile(htmlFilePath, html), ...downloadAssetsPromises]).catch(
        (error) => console.error(error.message),
      );
    })
    .then(() => console.log(`Page was successfully downloaded into '${htmlFilePath}'`))
    .then(() => htmlFilePath)
    .catch((error) => console.error(`${error.message}:`, error));
};

export default pageLoader;
