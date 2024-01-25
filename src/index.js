import fs from 'fs/promises';
import { formatWithHyphen, makeAssetsDir, extractAssets, downloadAsset } from './utilities.js';
import path from 'path';
import axios from 'axios';

const pageLoader = (url, outputDirPath) => {
  const { hostname, pathname } = new URL(url);
  const formatedUrl = formatWithHyphen(`${hostname}${pathname}`);
  const htmlPageName = `${formatedUrl}.html`;
  const htmlPagePath = path.resolve(outputDirPath, htmlPageName);
  const assetsDirName = `${formatedUrl}_files`;
  const assetsDirPath = path.resolve(outputDirPath, assetsDirName);

  return axios
    .get(url)
    .then(({ data: htmlContent }) => {
      return makeAssetsDir(htmlContent, assetsDirPath);
    })
    .then((htmlContent) => {
      const { html, assetsOptions } = extractAssets(htmlContent, hostname, assetsDirName);
      assetsOptions.forEach(downloadAsset);

      fs.writeFile(htmlPagePath, html);
    })
    //.then((htmlContent) => fs.writeFile(htmlPagePath, htmlContent))
    .then(() => {
      console.log(`Page was successfully downloaded into '${htmlPagePath}'`);
      return htmlPagePath;
    })
    .catch((error) => console.error(error.message));
};

export default pageLoader;
