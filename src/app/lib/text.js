export const splitVals = (value) => (value ? value.split(';') : []);
export const strip = (value) => value.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().replace(/\s+/g, ' ').trim();
export const norm = (value) => value.normalize('NFC').toLowerCase().replace(/\s+/g, ' ').trim();
export const shuffle = (values) => {
  const result = values.slice();
  for (let index = result.length - 1; index > 0; index -= 1) {
    const other = Math.floor(Math.random() * (index + 1));
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
};
