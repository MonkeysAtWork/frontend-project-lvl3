import '@babel/polyfill';
import axios from 'axios';
import _ from 'lodash';
import * as yup from 'yup';

import view from './view';


const validate = value => yup.string().url().validate(value);


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


const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

const makeAutoRequestLoop = (funk, ms) => {
  wait(ms)
    .then(funk)
    .then(() => makeAutoRequestLoop(funk, ms))
    .catch(() => makeAutoRequestLoop(funk, ms));
};


const isRSS = doc => doc.documentElement.tagName === 'rss';

const parseRSS = (data) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(data, 'text/xml');
  if (!isRSS(doc)) {
    throw new Error('errors.notTargetURL');
  }
  const title = doc.querySelector('title').textContent;
  const description = doc.querySelector('description').textContent;

  const items = doc.querySelectorAll('item');
  const posts = [...items].map((item) => {
    const link = item.querySelector('link').textContent;
    const content = item.querySelector('description').textContent;
    return { link, content };
  });
  return { title, description, posts };
};


const getNewPosts = (posts, currentFeedId, postsList) => {
  const addingPosts = postsList.filter(({ id }) => id === currentFeedId);
  const newPosts = _.differenceBy(posts, addingPosts, 'link');
  return newPosts;
};

const getFeedContent = (feed, state, isItAutoRequest) => {
  const { title, description, posts } = feed;
  const existingFeed = _.find(state.feedsList, { title });
  if (!isItAutoRequest && existingFeed) {
    throw new Error('errors.repeatURL');
  }
  let newPosts;
  let newFeed;
  let id;
  if (existingFeed) {
    id = existingFeed.id; // eslint-disable-line prefer-destructuring
    newFeed = [];
    newPosts = getNewPosts(posts, id, state.postsList);
  } else {
    id = _.uniqueId();
    newFeed = [{ title, description, id }];
    newPosts = posts;
  }
  newPosts = newPosts.map(post => ({ ...post, id }));
  return { newPosts, newFeed };
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


  const handleInput = (e) => {
    const { value } = e.target;
    state.form.url = value;
    validate(value)
      .then(() => {
        state.form.errors = null;
      })
      .catch(() => {
        state.form.errors = 'errors.invalidURL';
      });
  };


  const handleUrl = (url, isAutoRequest = false) => makeRequest(url)
    .then((data) => {
      const feed = parseRSS(data);
      const { newFeed, newPosts } = getFeedContent(feed, state, isAutoRequest);
      state.feedsList.unshift(...newFeed);
      state.postsList.unshift(...newPosts);
    });


  const handleSubmit = (e) => {
    e.preventDefault();
    state.form.formState = 'processing';
    const { url } = state.form;
    handleUrl(url)
      .then(() => {
        state.form.url = '';
        state.form.formState = 'filling';
        makeAutoRequestLoop(() => handleUrl(url, true), 5000);
      })
      .catch((err) => {
        state.form.formState = 'filling';
        state.form.errors = err.message;
      });
  };

  view(state, handleInput, handleSubmit);
};
