let _NEXTID = 100;

export const nextId = (prefix='id') => `${prefix}${_NEXTID++}`;

export const mR = (x, dp) => {
    if (!dp) return Math.round(x)
    return Math.round((x + Number.EPSILON) * Math.pow(10, dp)) /  Math.pow(10, dp)
}

export const sum = arr => arr.reduce((a, b) => a + b, 0);

export const avg = arr => arr.length ? sum(arr) / arr.length : 0;

export const percent = (a, b) => (a/b)*100;

export const capWord = string => string[0].toUpperCase() + string.slice(1).toLowerCase();

export const strMap = (arr, f, sep='') => arr.map((d, i) => f(d, i)).join(sep);  // TODO switch everything to this in the html


const createDonutChart = (data, innerR=0.5) => {
    // !!! note that there's no validation ensuring data totals 100, or that innerR is between 0-1
    let rem = 100

    const strokeW = (32 - 32*innerR) / (1 + innerR)  // converts innerR ratio into stroke width between 0-32

    const r = 100/(2*Math.PI)
    const boxR = Math.ceil(r) * 2 + strokeW

    const lineW = 1/128

    // TODO add labels to graph
    return `
<svg width="100%" height="100%" viewBox="0 0 ${boxR} ${boxR}">  
    ${strMap(data, d => {
        const [ col, size ] = d
        rem -= size
        return `<circle cx="${boxR/2}" cy="${boxR/2}" r="${r}" fill="transparent" stroke="${col}" stroke-width="${strokeW}" stroke-dasharray="${size} ${100-size}" stroke-dashoffset="${25-rem}"></circle>`
    })}

    <circle cx="${boxR/2}" cy="${boxR/2}" r="${r+(strokeW/2)-(boxR*lineW/2)}" fill="transparent" stroke-opacity="0.25" stroke="#222222" stroke-width="${boxR*lineW}"></circle>
    <circle cx="${boxR/2}" cy="${boxR/2}" r="${innerR ? r-(strokeW/2)+(boxR*lineW/2) : 0}" fill="transparent" stroke-opacity="0.25" stroke="#222222" stroke-width="${boxR*lineW}"></circle>
</svg>
    `
}

export const createMacroDonut = (macros) => {
    return createDonutChart([
        ['#6bc7d6', macros.carbs],
        ['#eeb866', macros.fat],
        ['#c680bc', macros.protein]
    ], 3/8)
}