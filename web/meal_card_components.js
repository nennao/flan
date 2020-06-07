import { MACROS } from "./mealplan_config.js";
import { nextId, sum, avg, percent, strMap } from "./utils.js"


export const PLAN_BUFFER = 40;  // px

const mealTypes = ['breakfast', 'lunch', 'dinner', 'snacks'];


const sbFlex = (x, y) => {
    return `<div class="sbFlexMCC"><div>${x}</div><div>${y}</div></div>`
};


const relIngCals = ing => Math.round((ing.qty/ing.basis.qty) * ing.basis.calories);

const mealItemCals = mi => mi.ingredients ? sum(mi.ingredients.map(ing => relIngCals(ing))) : mi.calories;

const mealItemMacroCals = (mi, macro) => mi.ingredients ?
        sum(mi.ingredients.map(ing => ((ing.macros[macro] / 100) * relIngCals(ing)))) :
        ((mi.macros[macro]/100) * mi.calories);


const collapsible = (heading, content, show=true, classes=[]) => {
    if (!content) {
        return `<div class="${classes.join(' ')}">${heading}</div>`
    }
    const id = nextId();
    return `
        <div class="collapsible ${classes.join(' ')}">
            <div class="collapsibleHead" data-toggle="collapse" data-target="#${id}_collapsible">${heading}</div>
            <div class="collapsibleBody collapse${show ? ' show' : ''}" id="${id}_collapsible">${content}</div>
        </div>
    `
};


const caloriesCard = (id, d, i, editable) => {
    const dayBody = () => {
        const mealMap = {breakfast: [], lunch: [], dinner: [], snacks: []};
        for (let el of d.elements) mealMap[el.type.toLowerCase()].push(el);
        return `
        <div class="mealTypeContainer">
          <div class="mealTypeHead">${sbFlex('TOTAL', `<span>${sum(d.elements.map(el => mealItemCals(el)))}</span>`)}</div>
        </div>
        <div class="mealTypeContainer">
          <div class="mealTypeHead">${sbFlex('PLAN', `<span>${d.planType}</span>`)}</div>
        </div>
        ${strMap(mealTypes, mt => collapsible(
             `<div class="mealTypeHead">${sbFlex(mt, `<span>${sum(mealMap[mt].map(mm => mealItemCals(mm)))}</span>`)}</div>`,
            strMap(mealMap[mt], mm => collapsible(
                sbFlex(
                    `<div>${mm.name}</div><div class="mealItemQty">${mm.qty} ${mm.unit}</div>`,
                    mealItemCals(mm)
                ),
                mm.ingredients && strMap(mm.ingredients, ing => {
                    return `
                        <div class="mealItemIng">${sbFlex(
                            `<div>${ing.name}</div><div class="mealItemQty">${ing.qty} ${ing.basis.unit || ing.name}</div>`,
                            relIngCals(ing)
                        )}</div>
                    `
                }),
                false, ['mealItem']
            )),
            true, ['mealTypeContainer']
          ))}
    `};
    const sumBody = () => `
        <div class="mealTypeContainer">
          <div class="mealTypeHead">${sbFlex('AVERAGE', `<span>${d.avg}</span>`)}</span></div>
          <div class="mealItem">${sbFlex('total', `<span>${d.tot}</span>`)}</span></div>
        </div>
        ${strMap(mealTypes, mt => `
            <div class="mealTypeContainer">
              <div class="mealTypeHead">${sbFlex(mt, `<span>${d[mt].avg}</span>`)}</span></div>
              <div class="mealItem">${sbFlex('total', `<span>${d[mt].tot}</span>`)}</span></div>
            </div>
        `)}
    `;

    return `
        <div class="card">
          <div class="card-header" id="${id}_mealCardCalsHead${i}">
            <h2 class="mb-0">
              <button class="btn btn-link btn-block" type="button" data-toggle="collapse" data-target="#${id}_mealCardCalsBody${i}">
                ${d.isSum ? 'Average' : moment(d.date, 'YYYY-MM-DD').format('ddd Do MMM')}
              </button>
            </h2>
          </div>
        
          <div id="${id}_mealCardCalsBody${i}" class="collapse show">
            <div class="card-body">
              ${d.isSum ? sumBody() : dayBody()}
            </div>
          </div>
        </div>
    `
};



const macrosCard = (id, d, i) => {
    const totalCals = d.elements && sum(d.elements.map(el => mealItemCals(el)));
    return `
        <div class="card">
          <div class="card-header" id="${id}_mealCardMacrosHead${i}">
            <h2 class="mb-0">
              <button class="btn btn-link btn-block" type="button" data-toggle="collapse" data-target="#${id}_mealCardMacrosBody${i}">
                macros
              </button>
            </h2>
          </div>
      
          <div id="${id}_mealCardMacrosBody${i}" class="collapse show">
            <div class="card-body">
              ${strMap(MACROS, macro => `
                <div>${macro}: ${d.isSum ? d.macros[macro] : percent(sum(d.elements.map(el => mealItemMacroCals(el, macro))), totalCals)}%</div>
              `)}
            </div>
          </div>
        </div>
    `
};

const getSum = days => {
    const len = days.length;
    let calsTot = 0;
    const mealMap = {breakfast: 0, lunch: 0, dinner: 0, snacks: 0};
    const macroMap = {carbs: 0, fat: 0, protein: 0};
    for (let d of days) {
        for (let el of d.elements) {
            const cals = mealItemCals(el);
            calsTot += cals;
            mealMap[el.type] += cals;
            for (let m of MACROS) {
                macroMap[m] += mealItemMacroCals(el, m)
            }
        }
    }
    const calsAvg = Math.round(calsTot / len);
    for (let mt of mealTypes) mealMap[mt] = {avg: Math.round(mealMap[mt] / len), tot: mealMap[mt]};
    for (let m of MACROS) macroMap[m] = percent(macroMap[m], calsTot);
    return {
        isSum: true,
        avg: calsAvg,
        tot: calsTot,
        ...mealMap,
        macros: macroMap,
    }
};


const _weekPlan = (_days, id, editable) => {
    const days = [ ..._days ];
    if (days.length > 1) {
        days.push(getSum(days))
    }

    return `
        <div class="mealDaysContainer${editable ? ' editable': ''}">
            ${strMap(days, (d, i) => {
                return `
                  <div class="cardContainer">
                    ${caloriesCard(id, d, i, editable)}
                    
                    ${macrosCard(id, d, i)}
                  </div>
                `
            })}
        </div>
    `
};


export const editableWeekPlan = (days, id) => _weekPlan(days, id, true);
export const readonlyWeekPlan = (days, id) => _weekPlan(days, id, false);