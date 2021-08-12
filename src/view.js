/* eslint no-param-reassign: ["error", { "props": true,
"ignorePropertyModificationsFor": ["wState"] }] */
import onChange from 'on-change';

const initView = (state, i18nInstance, elements) => {
  const {
    submitButton, inputUrl, elementFeedback, elementFeeds, elementPosts, titleModal,
    bodyModal, buttonModal,
  } = elements;

  const renderMessage = (element, feedback, messageType, typeResult = 'success') => {
    const elementMessage = element;
    const feedbackElement = feedback;
    feedbackElement.innerHTML = '';
    feedbackElement.classList.remove('text-success', 'text-danger');
    element.classList.remove('is-invalid');
    if (typeResult === 'success') {
      const message = i18nInstance.t(`messages.${messageType}`);
      feedbackElement.classList.add('text-success');
      feedbackElement.innerHTML = message;
    } else {
      const errorMessage = i18nInstance.t([`messages.errors.${messageType}`, 'messages.errors.undefined']);
      feedbackElement.classList.add('text-danger');
      feedbackElement.innerHTML = errorMessage;
      elementMessage.classList.add('is-invalid');
    }
    element.focus();
  };

  const processStateHandler = (processState) => {
    switch (processState) {
      case 'failed':
        submitButton.disabled = false;
        inputUrl.removeAttribute('readonly');
        break;
      case 'filling':
        submitButton.disabled = false;
        break;
      case 'accepted':
        submitButton.disabled = false;
        inputUrl.removeAttribute('readonly');
        inputUrl.value = '';
        renderMessage(inputUrl, elementFeedback, 'success.add', 'success');
        break;
      case 'sending':
        submitButton.disabled = true;
        inputUrl.setAttribute('readonly', true);
        break;
      default:
        throw new Error(`Unknown state: ${processState}`);
    }
  };

  const renderPosts = (posts, rootEl, wState) => {
    const rootPosts = rootEl;
    rootPosts.innerHTML = '';
    const cardPosts = document.createElement('div');
    cardPosts.classList.add('card', 'border-0');
    rootPosts.appendChild(cardPosts);
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
      if (wState.ui.seenLinks.has(id)) {
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
        wState.ui.seenLinks.add(id);
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
        wState.ui.seenLinks.add(id);
      });
    });
  };

  const renderFeeds = (feeds, rootEl) => {
    const rootFeeds = rootEl;
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

  const renderSeenLink = (seenIds, wState) => {
    const seenPosts = wState.posts.filter((post) => seenIds.has(post.id));
    seenPosts.forEach((post) => {
      const linkElem = elementPosts.querySelector(`a[data-id="${post.id}"]`);
      linkElem.classList.remove('fw-bold');
      linkElem.classList.add('fw-normal');
      linkElem.classList.add('link-secondary');
    });
  };

  const renderModal = (data) => {
    titleModal.textContent = data.title;
    bodyModal.textContent = data.description;
    buttonModal.setAttribute('href', data.link);
  };

  const watchedState = onChange(state, (path, value) => {
    switch (path) {
      case 'inputRSSForm.error':
        renderMessage(inputUrl, elementFeedback, value, 'error');
        break;
      case 'processError':
        renderMessage(inputUrl, elementFeedback, value, 'error');
        break;
      case 'inputRSSForm.valid':
        submitButton.disabled = false;
        break;
      case 'inputRSSForm.process':
        processStateHandler(value);
        break;
      case 'feeds':
        renderFeeds(value, elementFeeds);
        break;
      case 'posts':
        renderPosts(value, elementPosts, watchedState);
        break;
      case 'ui.seenLinks':
        renderSeenLink(value, watchedState);
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
