
export default (data) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(data, 'application/xml');
  console.log(doc);
  const parseError = doc.querySelector('parsererror');
  if (parseError) {
    throw new Error(`Parse error: ${parseError}`);
  }  
  return doc;
};