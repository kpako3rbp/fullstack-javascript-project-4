install: 
	npm ci

publish:
	npm publish --dry-run

lint:
	npx eslint .
	
lint-fix:
	npx eslint --fix .

test:
	NODE_OPTIONS=--experimental-vm-modules npx jest

test-coverage:
	NODE_OPTIONS=--experimental-vm-modules npx jest --coverage

watch:
	NODE_OPTIONS=--experimental-vm-modules npx jest --watch

nockdebug:
	DEBUG=nock.* NODE_OPTIONS=--experimental-vm-modules npx jest