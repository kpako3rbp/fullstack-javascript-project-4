import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import nock from 'nock';
import prettier from 'prettier';
import pageLoader from '../src/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const getFixturePath = (filename) => path.join(__dirname, '..', '__fixtures__', filename);
const readFixture = async (filename) => fs.readFile(getFixturePath(filename), 'utf-8');
const createTempDir = async () => fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));

nock.disableNetConnect();
const testUrl = 'https://ru.hexlet.io/courses';

let tempDir;

beforeAll(async () => {
  tempDir = await createTempDir();
  console.log('Temporary direction:', tempDir);
});

beforeEach(() => {
  nock.cleanAll();
});

test('Download and save page', async () => {
  const testPageData = await readFixture('page.html');

  nock('https://ru.hexlet.io')
    .get('/courses')
    .reply(200, testPageData)
    .get('/assets/professions/nodejs.png')
    .reply(200, 'nodejs.png')
    .get('/assets/application.css')
    .reply(200, 'application.css')
    .get('/courses')
    .reply(200, 'courses.html')
    .get('/packs/js/runtime.js')
    .reply(200, 'runtime.js');

  const outputPath = await pageLoader(testUrl, tempDir);
  const expectedPage = await readFixture('expected.html');
  const resultPage = await fs.readFile(outputPath, 'utf-8');

  const prettifiedExpectedPage = await prettier.format(expectedPage, { parser: 'html' });
  const prettifiedResultPage = await prettier.format(resultPage, { parser: 'html' });

  // console.log(os.tmpdir(), 'os.tmpdir()');

  expect(outputPath).toEqual(path.join(tempDir, 'ru-hexlet-io-courses.html'));
  expect(prettifiedResultPage).toEqual(prettifiedExpectedPage);

  const assetsPaths = [
    'ru-hexlet-io-assets-professions-nodejs.png',
    'ru-hexlet-io-assets-application.css',
    'ru-hexlet-io-courses.html',
    'ru-hexlet-io-packs-js-runtime.js',
  ];

  const assetsDirection = 'ru-hexlet-io-courses_files';
  const assetsPromises = assetsPaths.map((filepath) => {
    const fullAssetPath = path.join(tempDir, assetsDirection, filepath);
    return fs
      .access(fullAssetPath)
      .then(() => true) // Файл существует и доступен
      .catch((error) => {
        if (error.code === 'ENOENT') {
          return false; // Файл не найден
        }
        throw error; // Ошибка доступа к файлу или другая ошибка
      });
  });

  const resourcesDownloaded = await Promise.all(assetsPromises);

  expect(resourcesDownloaded.every((value) => value)).toBeTruthy();
});

test('404', async () => {
  // Эмулируем сетевую ошибку, когда страница не найдена
  nock('https://incorrect')
    .get('/err')
    .reply(404);

  await expect(pageLoader('https://incorrect/err', tempDir)).rejects.toThrow();
});

test('Network error', async () => {
  // Эмулируем сетевую ошибку, например, отсутствие соединения с сервером
  nock('https://incorrect')
    .get('/err')
    .replyWithError('Network error');

  await expect(pageLoader('https://incorrect/err', tempDir)).rejects.toThrow();
});

test('File system access error', async () => {
  // Эмулируем ошибку доступа к файловой системе или отсутствие директории
  const invalidDir = '/invalid/directory';
  await expect(pageLoader('https://example.com', invalidDir)).rejects.toThrow();
});
