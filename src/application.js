import '@babel/polyfill';
import axios from 'axios';
import _ from 'lodash';
import * as yup from 'yup';

import view from './view';


const makeRequest = (url) => {
  const prefixURL = 'https://cors-anywhere.herokuapp.com';
  const proxy = axios.create({
    baseURL: prefixURL,
  });
  const promise = proxy.get(`/${url}`)
    .then(response => response.data)
    .catch((err) => {
      console.log(err.message);
      throw new Error('errors.unreachableURL');
    });
  return promise;
};


const isContainsRSS = doc => doc.documentElement.tagName === 'rss';

const parseRSS = (xmlDoc) => {
  const title = xmlDoc.querySelector('title').textContent;
  const description = xmlDoc.querySelector('description').textContent;
  const Feedlink = xmlDoc.querySelector('link').textContent;
  const channel = { title, description, link: Feedlink };

  const items = xmlDoc.querySelectorAll('item');
  const posts = [...items].map((item) => {
    const postlink = item.querySelector('link').textContent;
    const content = item.querySelector('description').textContent;

    return { link: postlink, content };
  });

  return { channel, posts };
};


export default () => {
  const state = {
    form: {
      url: '',
      formState: 'filling',
      errors: null,
    },
    feedsList: [],
    postsList: [],
  };


  const inputHandler = (e) => {
    const { value } = e.target;
    state.form.url = value;
    yup.string().url().isValid(value).then((isValid) => {
      if (isValid) {
        state.form.errors = null;
      } else {
        state.form.errors = 'errors.invalidURL';
      }
    });
  };


  const submitHandler = (e) => {
    e.preventDefault();
    state.form.formState = 'processing';
    makeRequest(state.form.url)
      .then((data) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(data, 'text/xml');
        if (!isContainsRSS(doc)) {
          throw new Error('errors.notTargetURL');
        }
        const feed = parseRSS(doc);
        const wasAddedBefore = _.some(state.feedsList, feed.channel);
        if (wasAddedBefore) {
          throw new Error('errors.repeatURL');
        }

        const id = _.uniqueId();
        state.feedsList.push({ ...feed.channel, id });
        feed.posts.forEach(post => state.postsList.push({ ...post, id }));
        state.form.url = '';
        state.form.formState = 'filling';
      })
      .catch((err) => {
        state.form.formState = 'filling';
        state.form.errors = err.message;
      });
  };

  view(state, inputHandler, submitHandler);
};
