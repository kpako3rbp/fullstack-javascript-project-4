import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import nock from 'nock';
import pageLoader from '../src/index.js';
import prettier from 'prettier';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const getFixturePath = (filename) => path.join(__dirname, '..', '__fixtures__', filename);
const readFile = async (filename) => fs.readFile(getFixturePath(filename), 'utf-8');
const createTempDir = async () => fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));

nock.disableNetConnect();

let tempDir;

beforeAll(async () => {
  tempDir = await createTempDir();
});

beforeEach(() => {
  nock.cleanAll();
});

test('Download and save page', async () => {
  const testPage = await readFile('page.html');
  const expectedPage = await readFile('expected.html');  

  const testOrigin = 'https://ru.hexlet.io';
  const testPathName = '/courses';
  const testUrl = path.join(testOrigin, testPathName);

  nock(testOrigin).get(testPathName).reply(200, testPage);

  const outputPath = await pageLoader(testUrl, tempDir);

  //console.log(outputPath, 'outputPath');

  const resultPage = await fs.readFile(outputPath, 'utf-8');

  const prettifiedExpectedPage = await prettier.format(expectedPage, { parser: 'html' });
  const prettifiedResultPage = await prettier.format(resultPage, { parser: 'html' });

  //console.log(os.tmpdir(), 'os.tmpdir()');

  expect(outputPath).toEqual(path.join(tempDir, 'ru-hexlet-io-courses.html'));
  expect(prettifiedResultPage).toEqual(prettifiedExpectedPage);
});
