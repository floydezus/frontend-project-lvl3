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
        inputRSSForm: {
          valid: false,
          process: 'filling',
          error: null,
        },
        ui: {
          seenLinks: new Set(),
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
      elements.elementFeedback = document.querySelector('.feedback');
      elements.elementFeeds = document.querySelector('.feeds');
      elements.elementPosts = document.querySelector('.posts');
      elements.titleModal = document.querySelector('.modal-title');
      elements.bodyModal = document.querySelector('.modal-body');
      elements.buttonModal = document.querySelector('.modal-footer .btn-primary');

      const watchedState = initView(state, i18nInstance, elements);

      const baseURLSchema = yup.string().required().url();

      const validateURL = (url, feeds) => {
        const urls = feeds.map((el) => el.url);
        const currentURLSchema = baseURLSchema.notOneOf(urls);
        try {
          currentURLSchema.validateSync(url);
          return null;
        } catch (err) {
          return err.type;
        }
      };

      const buildFeedAndPosts = (data, currentUrl) => {
        const { title, description, items } = data;
        const idFeed = _.uniqueId();
        watchedState.feeds.unshift({
          id: idFeed, title, description, url: currentUrl,
        });
        const posts = items.map((i) => ({ ...i, id: _.uniqueId(), idFeed }));
        watchedState.posts.unshift(...posts);
      };

      const updateData = () => {
        const promisesFeed = watchedState.feeds.map((feed) => axios.get(addProxyToLink(feed.url))
          .then((response) => {
            const feedData = parse(response.data.contents);
            const newPosts = feedData.items;
            const oldPosts = watchedState.posts.filter((el) => el.idFeed === feed.id);
            const diffTitle = _.differenceWith(newPosts.map((post) => post.title),
              oldPosts.map((post) => post.title), _.isEqual);
            if (diffTitle.length !== 0) {
              const addedPosts = newPosts.filter((post) => diffTitle.includes(post.title))
                .map((i) => ({ ...i, id: _.uniqueId(), idFeed: feed.id }));
              watchedState.posts.unshift(...addedPosts);
            }
          })
          .catch((err) => err));

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
        const error = validateURL(url, watchedState.feeds);
        if (error) {
          watchedState.inputRSSForm.error = error;
          watchedState.inputRSSForm.valid = false;
          return;
        }
        watchedState.inputRSSForm.valid = true;
        watchedState.inputRSSForm.error = null;
        watchedState.inputRSSForm.process = 'sending';
        axios.get(addProxyToLink(url))
          .then((response) => {
            const content = parse(response.data.contents);
            buildFeedAndPosts(content, url);
            watchedState.inputRSSForm.process = 'accepted';
          })
          .catch((err) => {
            if (err.isAxiosError) {
              watchedState.processError = 'network';
            }
            if (err.isParsingError) {
              watchedState.processError = 'parsing';
            }
            watchedState.inputRSSForm.process = 'failed';
          });
      });
    });
};

export default app;
