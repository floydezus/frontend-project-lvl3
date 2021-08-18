/* eslint-disable no-param-reassign */
/* eslint no-param-reassign: ["error", { "props": true,
"ignorePropertyModificationsFor": ["wState"] }] */
import onChange from 'on-change';

const initView = (state, i18nInstance, elements) => {
  const renderMessage = (messageKey, type = 'success') => {
    const { feedback, inputUrl } = elements;
    feedback.innerHTML = '';
    feedback.classList.remove('text-success', 'text-danger');
    inputUrl.classList.remove('is-invalid');
    if (messageKey === null) {
      return;
    }
    switch (type) {
      case 'success':
        feedback.classList.add('text-success');
        feedback.innerHTML = i18nInstance.t(`messages.${messageKey}`);
        break;
      case 'error':
        feedback.classList.add('text-danger');
        feedback.innerHTML = i18nInstance.t([`messages.errors.${messageKey}`, 'messages.errors.undefined']);
        inputUrl.classList.add('is-invalid');
        break;
      default:
        throw new Error(`Unknown type message: ${type}`);
    }
  };

  const processStateHandler = (processState) => {
    const { submitButton, inputUrl } = elements;
    switch (processState) {
      case 'failed':
        submitButton.disabled = false;
        inputUrl.removeAttribute('readonly');
        break;
      case 'filling':
        submitButton.disabled = false;
        inputUrl.focus();
        break;
      case 'accepted':
        submitButton.disabled = false;
        inputUrl.removeAttribute('readonly');
        inputUrl.value = '';
        renderMessage('success.add', 'success');
        break;
      case 'sending':
        submitButton.disabled = true;
        inputUrl.setAttribute('readonly', true);
        break;
      default:
        throw new Error(`Unknown state: ${processState}`);
    }
  };

  const renderPosts = (wState) => {
    const { posts: postsBox } = elements;
    const { posts } = wState;
    postsBox.innerHTML = '';
    const cardPosts = document.createElement('div');
    cardPosts.classList.add('card', 'border-0');
    postsBox.appendChild(cardPosts);
    const bodyPosts = document.createElement('div');
    bodyPosts.classList.add('card-body');
    cardPosts.appendChild(bodyPosts);
    const titlePosts = document.createElement('h2');
    titlePosts.classList.add('card-title');
    titlePosts.textContent = i18nInstance.t('interface.fields.posts');
    bodyPosts.appendChild(titlePosts);
    const groupListPosts = document.createElement('ul');
    groupListPosts.classList.add('list-group');
    cardPosts.appendChild(groupListPosts);

    posts.forEach(({
      title, description, link, id,
    }) => {
      const listItem = document.createElement('li');
      listItem.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start', 'border-0', 'border-end-0');
      groupListPosts.appendChild(listItem);
      const linkElem = document.createElement('a');
      if (wState.ui.seenPosts.has(id)) {
        linkElem.classList.add('fw-normal');
        linkElem.classList.add('link-secondary');
      } else {
        linkElem.classList.add('fw-bold');
      }
      linkElem.href = link;
      linkElem.textContent = title;
      linkElem.setAttribute('data-id', id);
      listItem.appendChild(linkElem);

      linkElem.addEventListener('click', () => {
        wState.ui.seenPosts.add(id);
      });

      const buttonElem = document.createElement('button');
      buttonElem.classList.add('btn', 'btn-outline-primary', 'btn-sm');
      buttonElem.textContent = i18nInstance.t('interface.buttons.view');
      buttonElem.setAttribute('data-id', id);
      buttonElem.setAttribute('data-bs-toggle', 'modal');
      buttonElem.setAttribute('data-bs-target', '#modal');
      listItem.appendChild(buttonElem);

      buttonElem.addEventListener('click', () => {
        wState.ui.dataModal = { title, description, link };
        wState.ui.seenPosts.add(id);
      });
    });
  };

  const renderFeeds = (feeds) => {
    const { feeds: rootFeeds } = elements;
    rootFeeds.innerHTML = '';
    const cardFeeds = document.createElement('div');
    cardFeeds.classList.add('card', 'border-0');
    rootFeeds.appendChild(cardFeeds);
    const bodyFeeds = document.createElement('div');
    bodyFeeds.classList.add('card-body');
    cardFeeds.appendChild(bodyFeeds);
    const titleFeeds = document.createElement('h2');
    titleFeeds.classList.add('card-title');
    titleFeeds.textContent = i18nInstance.t('interface.fields.feeds');
    bodyFeeds.appendChild(titleFeeds);
    const groupListFeeds = document.createElement('ul');
    groupListFeeds.classList.add('list-group');
    cardFeeds.appendChild(groupListFeeds);

    feeds.forEach(({ title, description }) => {
      const listItem = document.createElement('li');
      listItem.classList.add('list-group-item', 'border-0');
      groupListFeeds.appendChild(listItem);

      const titleItem = document.createElement('h3');
      titleItem.classList.add('m-0', 'h6');
      titleItem.textContent = title;
      listItem.appendChild(titleItem);

      const descrItem = document.createElement('p');
      descrItem.classList.add('m-0', 'small', 'text-black-50');
      descrItem.innerHTML = description;
      listItem.appendChild(descrItem);
    });
  };

  const renderModal = (data) => {
    const { titleModal, bodyModal, buttonModal } = elements;
    titleModal.textContent = data.title;
    bodyModal.textContent = data.description;
    buttonModal.setAttribute('href', data.link);
  };

  const watchedState = onChange(state, (path, value) => {
    switch (path) {
      case 'mainForm.error':
        renderMessage(value, 'error');
        break;
      case 'processError':
        renderMessage(value, 'error');
        break;
      case 'mainForm.process':
        processStateHandler(value);
        break;
      case 'feeds':
        renderFeeds(value);
        break;
      case 'posts':
        renderPosts(watchedState);
        break;
      case 'ui.seenPosts':
        renderPosts(watchedState);
        break;
      case 'ui.dataModal':
        renderModal(value);
        break;
      default:
        break;
    }
  });
  return watchedState;
};

export default initView;
