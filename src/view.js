import { watch } from 'melanke-watchjs';
import _ from 'lodash';
import i18next from 'i18next';

export default (state, inputHandler, submitHandler) => {
  i18next.init({
    lng: 'en',
    resources: {
      en: {
        translation: {
          errors: {
            unreachableURL: 'URL is unreachable',
            invalidURL: 'URL is not correct',
            notTargetURL: 'No feeds were found for this URL',
            repeatURL: 'this feed already was added',
            unknownState: 'unknown state ({{ formState }})',
          },
        },
      },
    },
  }).then((t) => {
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
      const { formState } = state.form;
      switch (formState) {
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
          throw new Error(t('errors.unknownState', { formState }));
      }
    });


    watch(state.form, 'url', () => {
      if (!state.form.url) {
        formElement.reset();
        submitButton.setAttribute('disabled', true);
      } else if (state.form.errors) {
        submitButton.setAttribute('disabled', true);
      } else {
        submitButton.removeAttribute('disabled');
      }
    });


    watch(state.form, 'errors', () => {
      if (state.form.errors) {
        feedbackDiv.innerHTML = t(state.form.errors);
        linkField.classList.add('is-invalid');
        submitButton.setAttribute('disabled', true);
        linkField.focus();
      } else {
        linkField.classList.remove('is-invalid');
        feedbackDiv.innerHTML = '';
      }
    });


    const makeChannelElementHtml = _.template(
      `<h5 class="mb-1"><%= title %></h5>
    <p class="mb-1"><%= description %></p>`,
    );


    watch(state, 'postsList', () => {
      feedsConteiner.innerHTML = '';

      const divForFeeds = document.createElement('div');
      divForFeeds.classList.add('list-group', 'list-group-flush', 'border-right');
      feedsConteiner.append(divForFeeds);

      state.feedsList.forEach((channel) => {
        const div = document.createElement('div');
        div.classList.add('list-group-item');
        div.innerHTML = makeChannelElementHtml(channel);
        divForFeeds.append(div);
      });

      postsConteiner.innerHTML = '';

      const ulForPosts = document.createElement('ul');
      ulForPosts.classList.add('list-group', 'list-group-flush', 'overflow-auto');
      postsConteiner.append(ulForPosts);

      state.postsList.forEach(({ link, content }) => {
        const li = document.createElement('li');
        li.classList.add('list-group-item');
        const a = document.createElement('a');
        a.href = link;
        a.innerHTML = content;
        li.append(a);
        ulForPosts.append(li);
      });
    });
  });
};
