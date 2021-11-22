let _NEXTID = 100;

export const nextId = (prefix='id') => `${prefix}${_NEXTID++}`;

export const mR = (x, dp) => {
    if (!dp) return Math.round(x)
    return Math.round((x + Number.EPSILON) * Math.pow(10, dp)) /  Math.pow(10, dp)
}

export const sum = arr => arr.reduce((a, b) => a + b, 0);

export const avg = arr => arr.length ? sum(arr) / arr.length : 0;

export const percent = (a, b) => Math.round((a/b)*100);

export const capWord = string => string[0].toUpperCase() + string.slice(1).toLowerCase();

export const strMap = (arr, f, sep='') => arr.map((d, i) => f(d, i)).join(sep);  // TODO switch everything to this in the html
