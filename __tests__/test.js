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

const response = fs.readFileSync(path.join(fixturesPath, 'rss.xml'), 'utf-8');
const url = 'http://www.test.com';
const inputEvent = new Event('input', { bubbles: true });

const delay = time => new Promise(resolve => setTimeout(resolve, time));
const getTree = () => html(document.body.innerHTML);
const scope = nock('https://cors-anywhere.herokuapp.com'); // .log(console.log);

let form;
let input;

beforeEach(() => {
  const initHtml = fs.readFileSync(path.join(fixturesPath, 'index.html'), 'utf-8');
  document.documentElement.innerHTML = initHtml;
  run();
  form = document.querySelector('#rssAddForm');
  input = form.elements.link;
});


test('invalid URL', () => Promise.resolve()
  .then(() => {
    input.value = 'uncorrect';
    input.dispatchEvent(inputEvent);
  })
  .then(() => delay(10))
  .then(() => expect(getTree()).toMatchSnapshot()));


test('uncorrect URL', () => Promise.resolve()
  .then(() => {
    scope
      .get(/404$/)
      .replyWithError('something error');
    input.value = `${url}/404`;
    input.dispatchEvent(inputEvent);
  })
  .then(() => delay(10))
  .then(() => expect(getTree()).toMatchSnapshot())
  .then(() => form.dispatchEvent(new Event('submit')))
  .then(() => delay(300))
  .then(() => expect(getTree()).toMatchSnapshot()));


test('network error', () => Promise.resolve()
  .then(() => {
    scope
      .get(/404$/)
      .reply(404, response);
    input.value = `${url}/404`;
    input.dispatchEvent(inputEvent);
  })
  .then(() => delay(10))
  .then(() => expect(getTree()).toMatchSnapshot())
  .then(() => form.dispatchEvent(new Event('submit')))
  .then(() => delay(300))
  .then(() => expect(getTree()).toMatchSnapshot()));


test('no feed on URL', () => Promise.resolve()
  .then(() => {
    scope
      .get(/nofeed$/)
      .reply(200, '<!doctype html><html><head></head><body></body></html>');
    input.value = `${url}/nofeed`;
    input.dispatchEvent(inputEvent);
  })
  .then(() => delay(10))
  .then(() => form.dispatchEvent(new Event('submit')))
  .then(() => delay(300))
  .then(() => expect(getTree()).toMatchSnapshot()));


test('correct URL twice', () => Promise.resolve()
  .then(() => {
    scope
      .get(/feed$/)
      .reply(200, response);
    input.value = `${url}/feed`;
    input.dispatchEvent(inputEvent);
  })
  .then(() => delay(10))
  .then(() => form.dispatchEvent(new Event('submit')))
  .then(() => delay(300))
  .then(() => expect(getTree()).toMatchSnapshot())
  .then(() => {
    scope
      .get(/feed$/)
      .reply(200, response);
    input.value = `${url}/feed`;
    input.dispatchEvent(inputEvent);
  })
  .then(() => delay(10))
  .then(() => form.dispatchEvent(new Event('submit')))
  .then(() => delay(300))
  .then(() => expect(getTree()).toMatchSnapshot()));
