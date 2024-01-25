import fs from 'fs/promises';
import path from 'path';
import cheerio from 'cheerio';
import axios from 'axios';

const formatWithHyphen = (string) =>
  string.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '').replace(/[^a-zA-Z0-9]+/g, '-');

const makeAssetsDir = (htmlContent, assetsDirPath) =>
  fs
    .access(assetsDirPath)
    .then(() => htmlContent)
    .catch(() => fs.mkdir(assetsDirPath).then(() => htmlContent));

const downloadAsset = (url, filepath) =>
  axios.get(url, { responseType: 'arraybuffer' }).then(({ data }) => fs.writeFile(filepath, data));

const extractAssets = (htmlContent, hostname, assetsDirName) => {
  const $ = cheerio.load(htmlContent);

  const tagsAttributes = {
    img: 'src',
    link: 'href',
    script: 'src',
  };

  //const assetPaths = [];

  Object.entries(tagsAttributes).forEach(([tagName, attrName]) => {
    $(tagName).each((index, element) => {
      const fileUrl = $(element).attr(attrName);
      const { hostname: currentHostname, pathname } = new URL(fileUrl);

      if (currentHostname === hostname) {
        const fileExt = path.extname(pathname);
        const pathnameWithoutExt = pathname.replace(fileExt, '');

        const filename = `${formatWithHyphen(path.join(hostname, pathnameWithoutExt))}${fileExt}`;
        const localFilePath = path.join(assetsDirName, filename);

        $(element).attr(attrName, localFilePath);
        //assetPaths.push({ url: fileUrl, path: localFilePath });
        downloadAsset(fileUrl, localFilePath);
      }
    });
  });

  return $.html();
};

export { formatWithHyphen, makeAssetsDir, extractAssets, downloadAsset };
