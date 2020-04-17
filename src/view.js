import { watch } from 'melanke-watchjs';
import _ from 'lodash';
import i18next from 'i18next';


export default (state, inputHandler, submitHandler) => {
  const formElement = document.querySelector('#rssAddForm');
  const linkField = formElement.elements.link;
  const submitButton = document.querySelector('.btn');
  const feedbackDiv = document.querySelector('#feedback');
  const feedsConteiner = document.querySelector('#feeds');
  const postsConteiner = document.querySelector('#posts');

  formElement.addEventListener('input', inputHandler);
  formElement.addEventListener('submit', submitHandler);


  const spinner = document.createElement('span');
  spinner.classList.add('spinner-border', 'text-primary', 'spinner-border-sm', 'mr-1');

  watch(state.form, 'formState', () => {
    switch (state.form.formState) {
      case ('processed'):
        linkField.removeAttribute('disabled');
        spinner.remove();
        formElement.reset();
        break;
      case ('processing'):
        linkField.setAttribute('disabled', true);
        submitButton.setAttribute('disabled', true);
        submitButton.prepend(spinner);
        break;
      case ('filling'):
        linkField.removeAttribute('disabled');
        spinner.remove();
        break;
      default:
        throw new Error(`unknown state ${state.form.formstate}`);
    }
  });

  watch(state.form, 'error', () => {
    if (state.form.error) {
      feedbackDiv.innerHTML = i18next.t(state.form.error);
      linkField.classList.add('is-invalid');
      linkField.focus();
    } else {
      linkField.classList.remove('is-invalid');
      feedbackDiv.innerHTML = '';
    }
  });

  watch(state.form, 'valid', () => {
    if (state.form.valid) {
      submitButton.removeAttribute('disabled');
    } else {
      submitButton.setAttribute('disabled', true);
    }
  });


  const makeChannelElementHtml = _.template(
    `<h5 class="mb-1"><%= title %></h5>
    <p class="mb-1"><%= description %></p>`,
  );


  watch(state, 'posts', () => {
    feedsConteiner.innerHTML = '';

    const divForFeeds = document.createElement('div');
    divForFeeds.classList.add('list-group', 'list-group-flush', 'border-right');
    feedsConteiner.append(divForFeeds);

    state.feeds.forEach((channel) => {
      const div = document.createElement('div');
      div.classList.add('list-group-item');
      div.innerHTML = makeChannelElementHtml(channel);
      divForFeeds.append(div);
    });

    postsConteiner.innerHTML = '';

    const ulForPosts = document.createElement('ul');
    ulForPosts.classList.add('list-group', 'list-group-flush', 'overflow-auto');
    postsConteiner.append(ulForPosts);

    state.posts.forEach(({ link, content }) => {
      const li = document.createElement('li');
      li.classList.add('list-group-item');
      const a = document.createElement('a');
      a.href = link;
      a.innerHTML = content;
      li.append(a);
      ulForPosts.append(li);
    });
  });
};
