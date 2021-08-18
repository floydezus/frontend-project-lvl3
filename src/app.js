import 'bootstrap';
import axios from 'axios';
import * as yup from 'yup';
import _ from 'lodash';
import i18n from 'i18next';
import parse from './parser.js';
import resources from './locales';
import initView from './view.js';

const addProxyToLink = (link) => {
  const proxy = 'https://hexlet-allorigins.herokuapp.com/get';
  const buildedUrl = new URL(proxy);
  buildedUrl.searchParams.set('disableCache', true);
  buildedUrl.searchParams.set('url', link);
  return buildedUrl;
};

const app = () => {
  const delayTime = 5000;
  const i18nInstance = i18n.createInstance();
  i18nInstance.init({
    lng: 'ru',
    debug: false,
    resources,
  })
    .then(() => {
      const state = {
        mainForm: {
          process: 'filling',
          error: null,
        },
        ui: {
          seenPosts: new Set(),
          dataModal: null,
        },
        processError: null,
        feeds: [],
        posts: [],
      };
      const elements = {};
      elements.formRSS = document.querySelector('.rss-form');
      elements.submitButton = document.querySelector('button[type="submit"]');
      elements.inputUrl = document.querySelector('#urlInput');
      elements.feedback = document.querySelector('.feedback');
      elements.feeds = document.querySelector('.feeds');
      elements.posts = document.querySelector('.posts');
      elements.titleModal = document.querySelector('.modal-title');
      elements.bodyModal = document.querySelector('.modal-body');
      elements.buttonModal = document.querySelector('.modal-footer .btn-primary');

      const watchedState = initView(state, i18nInstance, elements);

      const baseURLSchema = yup.string().required().url();

      const validateURL = (url, feeds) => {
        const urls = feeds.map((el) => el.url);
        const currentURLSchema = baseURLSchema.notOneOf(urls);
        return currentURLSchema.validate(url).then(() => null).catch((err) => err.type);
      };

      const buildFeedAndPosts = (data, currentUrl) => {
        const { title, description, items } = data;
        const idFeed = _.uniqueId();
        watchedState.feeds.unshift({
          id: idFeed, title, description, url: currentUrl,
        });
        const posts = items.map((item) => ({ ...item, id: _.uniqueId(), idFeed }));
        watchedState.posts.unshift(...posts);
      };

      const updateData = () => {
        const promisesFeed = watchedState.feeds.map((feed) => axios.get(addProxyToLink(feed.url))
          .then((response) => {
            const feedData = parse(response.data.contents);
            const newPosts = feedData.items;
            const oldPosts = watchedState.posts.filter((el) => el.idFeed === feed.id);
            const diffPosts = _.differenceWith(newPosts, oldPosts, (x, y) => (x.title === y.title));
            if (diffPosts.length > 0) {
              const addedPosts = diffPosts
                .map((item) => ({ ...item, id: _.uniqueId(), idFeed: feed.id }));
              watchedState.posts.unshift(...addedPosts);
            }
          })
          .catch((err) => {
            console.log(err);
          }));

        Promise.all(promisesFeed)
          .finally(() => {
            setTimeout(() => {
              updateData();
            }, delayTime);
          });
      };

      updateData();

      elements.formRSS.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const url = formData.get('url');

        validateURL(url, watchedState.feeds).then((error) => {
          if (error) {
            watchedState.mainForm.error = error;
            return;
          }
          watchedState.mainForm.error = null;
          watchedState.mainForm.process = 'sending';
          axios.get(addProxyToLink(url))
            .then((response) => {
              const content = parse(response.data.contents);
              buildFeedAndPosts(content, url);
              watchedState.mainForm.process = 'accepted';
            })
            .catch((err) => {
              if (err.isAxiosError) {
                watchedState.processError = 'network';
              }
              if (err.isParsingError) {
                watchedState.processError = 'parsing';
              }
              watchedState.mainForm.process = 'failed';
            })
            .finally(() => {
              watchedState.mainForm.process = 'filling';
            });
        });
      });
    });
};

export default app;
