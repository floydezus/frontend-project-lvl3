export default (data) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(data, 'application/xml');
  const parseError = doc.querySelector('parsererror');
  if (parseError) {
    const error = new Error(`Parse error: ${parseError}`);
    error.isParsingError = true;
    throw error;
  }
  const titleElement = doc.querySelector('title');
  const title = titleElement.textContent;
  const descriptionElement = doc.querySelector('description');
  const description = descriptionElement.textContent;
  const itemsElement = [...doc.querySelectorAll('item')];
  const items = itemsElement.map((item) => {
    const titleEl = item.querySelector('title');
    const descriptionEl = item.querySelector('description');
    const linkEl = item.querySelector('link');
    return {
      title: titleEl.textContent,
      description: descriptionEl.textContent,
      link: linkEl.textContent,
    };
  });
  return { title, description, items };
};
