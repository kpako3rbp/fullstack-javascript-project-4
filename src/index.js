import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';
import {
  formatToHyphenCase,
  ensureAssetsDirectory,
  extractAssets,
  downloadAsset,
} from './utilities.js';

const extractAssetsAndWriteFile = (
  htmlContent,
  hostname,
  assetsDirName,
  outputDirPath,
  htmlFilePath,
) => {
  const { html, assetsOptions } = extractAssets(
    htmlContent,
    hostname,
    assetsDirName,
    outputDirPath,
  );
  const downloadPromises = assetsOptions.map(downloadAsset);

  return Promise.all([fs.writeFile(htmlFilePath, html), ...downloadPromises])
    .then(() => console.log(`Page was successfully downloaded into '${htmlFilePath}'`))
    .then(() => htmlFilePath)
    .catch((error) => console.error(error.message));
};

const pageLoader = (url, outputDirPath) => {
  const { hostname, pathname } = new URL(url);
  const formattedUrl = formatToHyphenCase(`${hostname}${pathname}`);
  const htmlFileName = `${formattedUrl}.html`;
  const htmlFilePath = path.resolve(outputDirPath, htmlFileName);
  const assetsDirName = `${formattedUrl}_files`;
  const assetsDirPath = path.resolve(outputDirPath, assetsDirName);

  return axios
    .get(url)
    .then(({ data: htmlContent }) => ensureAssetsDirectory(htmlContent, assetsDirPath))
    .then((htmlContent) => extractAssetsAndWriteFile(htmlContent, hostname, assetsDirName, outputDirPath, htmlFilePath))
    .catch((error) => console.error(error.message));
};

/* const pageLoader = (url, outputDirPath) => {
  const { hostname, pathname } = new URL(url);
  const formatedUrl = formatToHyphenCase(`${hostname}${pathname}`);
  const htmlPageName = `${formatedUrl}.html`;
  const htmlFilePath = path.resolve(outputDirPath, htmlPageName);
  const assetsDirName = `${formatedUrl}_files`;
  const assetsDirPath = path.resolve(outputDirPath, assetsDirName);

  return axios
    .get(url)
    .then(({ data: htmlContent }) => {
      return ensureAssetsDirectory(htmlContent, assetsDirPath);
    })
    .then((htmlContent) => {
      const { html, assetsOptions } = extractAssets(htmlContent, hostname, assetsDirName, outputDirPath);
      assetsOptions.forEach(downloadAsset);

      fs.writeFile(htmlFilePath, html);
    })
    //.then((htmlContent) => fs.writeFile(htmlFilePath, htmlContent))
    .then(() => {
      console.log(`Page was successfully downloaded into '${htmlFilePath}'`);
      return htmlFilePath;
    })
    .catch((error) => console.error(error.message));
}; */

export default pageLoader;
