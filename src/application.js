import axios from 'axios';
import _ from 'lodash';
import * as yup from 'yup';
import i18next from 'i18next';

import resources from './locales';
import view from './view';
import parseRSS from './parser';


const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const makeAutoRequestLoop = (func, ms) => wait(ms)
  .then(func)
  .finally(() => makeAutoRequestLoop(func, ms));


const makeValidationSchema = (feeds) => yup
  .string()
  .required()
  .url('form.errors.invalidURL')
  .notOneOf(feeds, 'form.errors.repeatURL');


const prefixURL = 'https://cors-anywhere.herokuapp.com';

const getFeedData = (url) => axios.get(`${prefixURL}/${url}`)
  .then((response) => parseRSS(response.data));


const addIdToPosts = (posts, id) => posts.map((post) => ({ ...post, id }));

const getNewPosts = (url, existingPosts) => getFeedData(url)
  .then((feed) => _.differenceBy(feed.posts, existingPosts, 'link'));


export default () => {
  i18next.init({
    lng: 'en',
    resources,
  }).then(() => {
    const state = {
      form: {
        formState: 'filling',
        valid: false,
        error: null,
      },
      feeds: [],
      posts: [],
    };


    const handleInput = (e) => {
      state.form.formState = 'filling';
      const { value } = e.target;
      const addedUrls = state.feeds.map((el) => el.url);
      const schema = makeValidationSchema(addedUrls);
      schema.validate(value)
        .then(() => {
          state.form.error = null;
          state.form.valid = true;
        })
        .catch((err) => {
          let errorMessage;
          if (!value) {
            errorMessage = null;
          } else {
            errorMessage = err.message;
          }
          state.form.error = errorMessage;
          state.form.valid = false;
        });
    };


    const handleSubmit = (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const url = formData.get('link');
      state.form.formState = 'processing';
      getFeedData(url)
        .then((data) => {
          const { title, description, posts } = data;
          const id = _.uniqueId();
          const newFeed = { title, description, id, url }; // eslint-disable-line object-curly-newline, max-len
          const newPosts = addIdToPosts(posts, id);

          state.feeds.unshift(newFeed);
          state.posts.unshift(...newPosts);
          state.form.formState = 'processed';
          state.form.valid = false;
        })
        .catch((err) => {
          let errorMessage;
          if (err.isAxiosError) {
            errorMessage = 'form.errors.unreachableURL';
          } else {
            errorMessage = err.message;
          }
          state.form.formState = 'filling';
          state.form.valid = false;
          state.form.error = errorMessage;
        });
    };


    const getFeedUpdates = ({ url, id }) => {
      const addedPosts = state.posts.filter((post) => post.id === id);
      const newPostsPromise = getNewPosts(url, addedPosts);
      return newPostsPromise.then((posts) => addIdToPosts(posts, id));
    };

    const updateFeeds = () => {
      if (state.feeds.length < 1) {
        return;
      }
      const promisies = state.feeds.map(getFeedUpdates);
      Promise.allSettled(promisies).then((p) => p
        .filter(({ status }) => status === 'fulfilled')
        .forEach(({ value }) => state.posts.unshift(...value)));
    };


    makeAutoRequestLoop(updateFeeds, 5000);
    view(state, handleInput, handleSubmit);
  });
};
