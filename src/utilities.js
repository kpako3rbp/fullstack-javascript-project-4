import fs from 'fs/promises';
import path from 'path';
import cheerio from 'cheerio';
import axios from 'axios';

const formatToHyphenCase = (string) => string.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '').replace(/[^a-zA-Z0-9]+/g, '-');

const ensureAssetsDirectory = (htmlContent, assetsDirPath) => fs
  .access(assetsDirPath)
  .then(() => htmlContent)
  .catch(() => fs.mkdir(assetsDirPath).then(() => htmlContent));

const extractAssets = (htmlContent, hostname, assetsDirName, outputDirPath) => {
  const $ = cheerio.load(htmlContent);
  const tagsAttributes = { img: 'src', link: 'href', script: 'src' };
  const assetsOptions = [];

  Object.entries(tagsAttributes).forEach(([tagName, attrName]) => {
    $(tagName).each((index, element) => {
      const fileUrl = $(element).attr(attrName);
      const { hostname: currentHostname, pathname } = new URL(fileUrl);

      if (currentHostname === hostname) {
        const fileExt = path.extname(pathname);
        const pathnameWithoutExt = pathname.replace(fileExt, '');
        const filename = `${formatToHyphenCase(path.join(hostname, pathnameWithoutExt))}${fileExt}`;
        const localFilePath = path.join(assetsDirName, filename);
        const absoluteFilePath = path.resolve(outputDirPath, localFilePath);

        $(element).attr(attrName, localFilePath);
        assetsOptions.push({ url: fileUrl, filepath: absoluteFilePath });
        // downloadAsset(fileUrl, localFilePath);
      }
    });
  });

  return { html: $.html(), assetsOptions };
};

const downloadAsset = ({ url, filepath }) => axios.get(url, { responseType: 'arraybuffer' }).then(({ data }) => fs.writeFile(filepath, data));

export {
  formatToHyphenCase, ensureAssetsDirectory, extractAssets, downloadAsset,
};
