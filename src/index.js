import fs from 'fs';
import path from 'path';
import axios from 'axios';
import https from 'https';

const pageLoader = (url, outputPath) => {
  const parsedUrl = new URL(url);
  const filename = `${`${parsedUrl.host}${parsedUrl.pathname}`
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .replace(/[^\w\d]+$/, '')}.html`;
  const filePath = path.resolve(outputPath, filename);
	
	return axios
		.get(url)
		.then((resp) => resp)
		.then((pageContent) => fs.writeFile(filePath, pageContent, 'utf-8'))
		.then(() => `Page was successfully downloaded into '${filePath}'`)
		.catch((error) => {
			console.log('ERROR!!!', error);
			switch (error.name) {
				case 'Error':
					console.log('Error:', error.message);
					break;
				case 'AxiosError':
					console.log('Error:', error.message);
					break;
				default:
					console.log(error);
			}
		});
};

export default pageLoader;
