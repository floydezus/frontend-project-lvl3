/* eslint no-param-reassign: ["error", { "props": true,
"ignorePropertyModificationsFor": ["wState"] }] */
import onChange from 'on-change';

const initView = (state, i18nInstance) => {
  const submitButton = document.querySelector('button[type="submit"]');
  const inputUrl = document.querySelector('#urlInput');
  const divURL = document.querySelector('#divUrl');
  const divFeeds = document.querySelector('.feeds');
  const divPosts = document.querySelector('.posts');
  const titleModal = document.querySelector('.modal-title');
  const bodyModal = document.querySelector('.modal-body');
  const buttonModal = document.querySelector('.modal-footer .btn-primary');

  const renderMessage = (element, messageType, isSuccess = true) => {
    const feedbackExist = divURL.querySelector('.feedback');
    const elementMessage = element;
    if (feedbackExist) {
      feedbackExist.remove();
      elementMessage.classList.remove('is-invalid');
    }
    const feedbackElement = document.createElement('div');
    if (isSuccess) {
      const message = i18nInstance.t(`messages.${messageType}`);
      feedbackElement.classList.add('feedback', 'text-success', 'position-absolute', 'small');
      feedbackElement.innerHTML = message;
    } else {
      console.log(messageType);
      const errorMessage = i18nInstance.t([`messages.errors.${messageType}`, 'messages.errors.undefined']);
      feedbackElement.classList.add('feedback', 'text-danger', 'position-absolute', 'small');
      feedbackElement.innerHTML = errorMessage;
      elementMessage.classList.add('is-invalid');
    }
    divURL.appendChild(feedbackElement);
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
        renderMessage(inputUrl, 'success.add');
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
      if (wState.ui.seenLinks.includes(id)) {
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
        wState.ui.seenLinks.unshift(id);
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
        wState.ui.seenLinks.unshift(id);
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
    const seenPosts = wState.posts.filter((post) => seenIds.includes(post.id));
    seenPosts.forEach((post) => {
      const linkElem = divPosts.querySelector(`a[data-id="${post.id}"]`);
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
        renderMessage(inputUrl, value, false);
        break;
      case 'processError':
        renderMessage(inputUrl, value, false);
        break;
      case 'inputRSSForm.valid':
        submitButton.disabled = false;
        break;
      case 'inputRSSForm.process':
        processStateHandler(value);
        break;
      case 'feeds':
        renderFeeds(value, divFeeds);
        break;
      case 'posts':
        renderPosts(value, divPosts, watchedState);
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
