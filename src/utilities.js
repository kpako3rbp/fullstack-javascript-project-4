import fs from 'fs/promises';
import path from 'path';
import cheerio from 'cheerio';
import axios from 'axios';

const formatToHyphenCase = (string) =>
  string.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '').replace(/[^a-zA-Z0-9]+/g, '-');

const ensureAssetsDirectory = (htmlContent, assetsDirPath) =>
  fs
    .access(assetsDirPath)
    .then(() => htmlContent)
    .catch(() => fs.mkdir(assetsDirPath).then(() => htmlContent));

const extractAssets = (htmlContent, pageUrl, assetsDirName, outputDirPath) => {
  const { origin, hostname } = pageUrl;
  const $ = cheerio.load(htmlContent);
  const tagsAttributes = { img: 'src', link: 'href', script: 'src' };
  const assetsOptions = [];

  Object.entries(tagsAttributes).forEach(([tagName, attrName]) => {
    $(tagName).each((index, element) => {
      const src = $(element).attr(attrName);
      const fileUrl = new URL(src, origin); // если полный путь, то ничего не изменится. Если относительный, то добавится адрес сайта
      const { hostname: currentHostname, pathname } = fileUrl;

      if (currentHostname === hostname) {
        const fileExt = path.extname(pathname) || '.html';
        const pathnameWithoutExt = pathname.replace(fileExt, '');
        const filename = `${formatToHyphenCase(path.join(hostname, pathnameWithoutExt))}${fileExt}`;
        const localFilePath = path.join(assetsDirName, filename);
        const absoluteFilePath = path.resolve(outputDirPath, localFilePath);

        $(element).attr(attrName, localFilePath);
        assetsOptions.push({ url: fileUrl, filepath: absoluteFilePath });
        // console.log('assetsOptions:', assetsOptions);
        // downloadAsset(fileUrl, localFilePath);
      }
    });
  });

  return { html: $.html(), assetsOptions };
};

const downloadAsset = ({ url, filepath }) =>
  axios.get(url, { responseType: 'arraybuffer' }).then(({ data }) => fs.writeFile(filepath, data));

export { formatToHyphenCase, ensureAssetsDirectory, extractAssets, downloadAsset };
