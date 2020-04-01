import nock from 'nock';
import path from 'path';
import fs from 'fs';
import { html } from 'js-beautify';

import run from '../src/application';


nock.disableNetConnect();

const fixturesPath = path.join(__dirname, '__fixtures__');

beforeAll(() => {
  const pathToTemplate = path.join(__dirname, '..', 'template.html');
  const pathToIndex = path.join(fixturesPath, 'index.html');
  fs.copyFileSync(pathToTemplate, pathToIndex);
});

const response = fs.readFileSync(path.join(fixturesPath, 'rss_0.xml'), 'utf-8');
const url = 'http://www.test.com';
const inputEvent = new Event('input', { bubbles: true });
const submitEvent = new Event('submit');


const delay = time => new Promise(resolve => setTimeout(resolve, time));
const getTree = () => html(document.body.innerHTML);
nock('https://cors-anywhere.herokuapp.com')
  // .log(console.log)
  .get(/undefined$/)
  .replyWithError('some error')
  .get(/404$/)
  .reply(404)
  .get(/nofeed$/)
  .reply(200, '<!doctype html><html><head></head><body></body></html>')
  .get(/feed$/)
  .twice()
  .reply(200, response);


let form;
let input;

beforeEach(() => {
  const initHtml = fs.readFileSync(path.join(fixturesPath, 'index.html'), 'utf-8');
  document.documentElement.innerHTML = initHtml;
  run();
  form = document.querySelector('#rssAddForm');
  input = form.elements.link;
});


test('invalid URL', () => {
  input.value = 'uncorrect';
  input.dispatchEvent(inputEvent);
  return delay(10)
    .then(() => expect(getTree()).toMatchSnapshot());
});


test('uncorrect URL', () => {
  input.value = `${url}/undefined`;
  input.dispatchEvent(inputEvent);
  return delay(10)
    .then(() => expect(getTree()).toMatchSnapshot())
    .then(() => form.dispatchEvent(submitEvent))
    .then(() => delay(300))
    .then(() => expect(getTree()).toMatchSnapshot());
});


test('network error', () => {
  input.value = `${url}/404`;
  input.dispatchEvent(inputEvent);
  return delay(10)
    .then(() => expect(getTree()).toMatchSnapshot())
    .then(() => form.dispatchEvent(submitEvent))
    .then(() => delay(300))
    .then(() => expect(getTree()).toMatchSnapshot());
});


test('no feed on URL', () => {
  input.value = `${url}/nofeed`;
  input.dispatchEvent(inputEvent);
  return delay(10)
    .then(() => form.dispatchEvent(submitEvent))
    .then(() => delay(300))
    .then(() => expect(getTree()).toMatchSnapshot());
});


test('correct URL twice', () => {
  input.value = `${url}/feed`;
  input.dispatchEvent(inputEvent);
  return delay(10)
    .then(() => form.dispatchEvent(submitEvent))
    .then(() => delay(300))
    .then(() => expect(getTree()).toMatchSnapshot())
    .then(() => {
      input.value = `${url}/feed`;
      input.dispatchEvent(inputEvent);
    })
    .then(() => delay(10))
    .then(() => form.dispatchEvent(submitEvent))
    .then(() => delay(300))
    .then(() => expect(getTree()).toMatchSnapshot());
});
