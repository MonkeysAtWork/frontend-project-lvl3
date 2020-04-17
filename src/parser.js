const isRSS = (doc) => doc.documentElement.tagName === 'rss';

export default (data) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(data, 'text/xml');
  if (!isRSS(doc)) {
    throw new Error('form.errors.notTargetURL');
  }
  const title = doc.querySelector('title').textContent;
  const description = doc.querySelector('description').textContent;
  const items = doc.querySelectorAll('item');
  const posts = [...items].map((item) => {
    const link = item.querySelector('link').textContent;
    const content = item.querySelector('description').textContent;
    return { link, content };
  });
  return { title, description, posts };
};
