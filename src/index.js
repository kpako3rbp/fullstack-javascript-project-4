import { promises as fsPromises } from 'node:fs';
import path from 'path';
import axios from 'axios';

const pageLoader = (url, outputPath) => {
  const parsedUrl = new URL(url);
  const filename = `${`${parsedUrl.host}${parsedUrl.pathname}`
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .replace(/[^\w\d]+$/, '')}.html`;
  const filePath = path.resolve(outputPath, filename);

  return fsPromises.access(outputPath)
    .then(() => axios.get(url))
    .then((resp) => resp.data)
    .then((pageContent) => fsPromises.writeFile(filePath, pageContent))
    .then(() => filePath)
    .catch((error) => console.error(error.message));
};

export default pageLoader;
