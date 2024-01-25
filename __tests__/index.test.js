import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import nock from 'nock';
import pageLoader from '../src/index.js';
import prettier from 'prettier';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const getFixturePath = (filename) => path.join(__dirname, '..', '__fixtures__', filename);
const readFixture = async (filename) => fs.readFile(getFixturePath(filename), 'utf-8');
const createTempDir = async () => fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));

nock.disableNetConnect();
const testUrl = 'https://ru.hexlet.io/courses';

let tempDir;

beforeAll(async () => {
  tempDir = await createTempDir();
});

beforeEach(() => {
  nock.cleanAll();
});

test('Download and save page', async () => {
  const testPage = await readFixture('page.html');

  nock('https://ru.hexlet.io')
    .get('/courses')
    .reply(200, testPage)
    .get('/assets/professions/nodejs.png')
    .reply(200, 'nodejs.png');

  const outputPath = await pageLoader(testUrl, tempDir);

  //console.log(outputPath, 'outputPath');
  console.log(tempDir, 'tempDir');

  const resultPage = await fs.readFile(outputPath, 'utf-8');
  const expectedPage = await readFixture('expected.html');

  const prettifiedExpectedPage = await prettier.format(expectedPage, { parser: 'html' });
  const prettifiedResultPage = await prettier.format(resultPage, { parser: 'html' });

  //console.log(os.tmpdir(), 'os.tmpdir()');

  expect(outputPath).toEqual(path.join(tempDir, 'ru-hexlet-io-courses.html'));
  expect(prettifiedResultPage).toEqual(prettifiedExpectedPage);

  // Check that resources were downloaded
  const assetsPaths = [
    'ru-hexlet-io-assets-professions-nodejs.png',
    'ru-hexlet-io-assets-application.css',
    'ru-hexlet-io-courses.html',
    'ru-hexlet-io-packs-js-runtime.js',
  ];

  const assetsDirection = 'ru-hexlet-io-courses_files';
  const assetsPromises = assetsPaths.map((filepath) => {
    const fullPath = path.join(tempDir, assetsDirection, filepath);
    return fs
      .access(fullPath)
      .then(() => true) // Файл существует и доступен
      .catch((error) => {
        if (error.code === 'ENOENT') {
          return false; // Файл не найден
        } else {
          throw error; // Ошибка доступа к файлу или другая ошибка
        }
      });
  });

  const resourcesDownloaded = await Promise.all(assetsPromises);

  expect(resourcesDownloaded.every((value) => value)).toBeTruthy();
});
