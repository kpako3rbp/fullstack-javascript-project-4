import { promises as fsPromises } from 'node:fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import nock from 'nock';
import pageLoader from '../src/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const getFixturePath = (filename) => path.join(__dirname, '..', '__fixtures__', filename);
const readFile = async (filename) => fsPromises.readFile(getFixturePath(filename), 'utf-8');
const createTempDir = async () => fsPromises.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));

nock.disableNetConnect();

let tempDir;

beforeAll(async () => {
  tempDir = await createTempDir();
});

beforeEach(() => {
  nock.cleanAll();
});

test('Download and save a page', async () => {
  const pageContent = await readFile('index.html');

  const testHostName = 'https://ru.hexlet.io';
  const testPathName = '/courses';
  const testUrl = `${testHostName}${testPathName}`;

  nock(testHostName).get(testPathName).reply(200, pageContent);

  const outputPath = await pageLoader(testUrl, tempDir);

  const resultPageContent = await fsPromises.readFile(outputPath, 'utf-8');

  console.log(os.tmpdir(), 'os.tmpdir()');

  expect(outputPath).toEqual(path.join(tempDir, 'ru-hexlet-io-courses.html'));
  expect(resultPageContent).toEqual(pageContent);
});
