export default (data) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(data, 'application/xml');
  // console.log(doc);
  const parseError = doc.querySelector('parsererror');
  if (parseError) {
    const error = new Error(`Parse error: ${parseError}`);
    error.isParsingError = true;
    throw error;
  }
  // console.log('after throw');
  const result = {};
  const title = doc.querySelector('title').textContent;
  result.title = title;
  result.description = doc.querySelector('description').textContent;
  const items = [...doc.querySelectorAll('item')];
  const mappedItems = items.map((i) => ({
    title: i.querySelector('title').textContent,
    description: i.querySelector('description').textContent,
    link: i.querySelector('link').textContent,
  }));
  // .map((el) => el.textContent);
  result.items = mappedItems;
  return result;
};
