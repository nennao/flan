
export const sum = arr => arr.reduce((a, b) => a + b, 0);

export const avg = arr => arr.length ? sum(arr) / arr.length : 0;

export const percent = (a, b) => Math.round((a/b)*100);  // TODO switch these

export const capWord = string => string[0].toUpperCase() + string.slice(1).toLowerCase();

export const strMap = (arr, f, sep='') => arr.map((d, i) => f(d, i)).join(sep);
