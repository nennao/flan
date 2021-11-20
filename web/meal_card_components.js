import { MACROS, MACRO_CAL_MAP } from "./mealplan_config.js";
import { mR, sum, avg } from "./utils.js"

export const PLAN_BUFFER = 40;  // px

const mealTypes = ['breakfast', 'lunch', 'dinner', 'snacks'];


const caloriesCard = (d, i, editable) => {
    const dayBody = () => {
        const mealMap = {breakfast: [], lunch: [], dinner: [], snacks: []};
        for (let el of d.elements) mealMap[el.type.toLowerCase()].push(el);
        return `
        <div class="mealTypeContainer">
          <div class="mealTypeHead">TOTAL <span>${mR(sum(d.elements.map(el => el.calories)))}</span></div>
        </div>
        <div class="mealTypeContainer">
          <div class="mealTypeHead">PLAN <span>${d.planType}</span></div>
        </div>
        ${mealTypes.map(mt => `
          <div class="mealTypeContainer">
            <div class="mealTypeHead">${mt} <span>${mR(sum(mealMap[mt].map(mm => mm.calories)))}</span></div>
            ${mealMap[mt].map(mm => `<div class="mealItem">${mm.name} ... ${mR(mm.calories)}</div>`).join('')}
          </div>
        `).join('')}
    `};
    const sumBody = () => `
        <div class="mealTypeContainer">
          <div class="mealTypeHead">AVERAGE <span>${d.avg}</span></div>
          <div class="mealItem">total <span>${mR(d.tot)}</span></div>
        </div>
        ${mealTypes.map(mt => `
            <div class="mealTypeContainer">
              <div class="mealTypeHead">${mt} <span>${d[mt].avg}</span></div>
              <div class="mealItem">total <span>${mR(d[mt].tot)}</span></div>
            </div>
        `).join('')}
    `;

    return `
        <div class="card">
          <div class="card-header" id="mealCardCalsHead${i}">
            <h2 class="mb-0">
              <button class="btn btn-link btn-block" type="button" data-toggle="collapse" data-target="#mealCardCalsBody${i}">
                ${d.isSum ? 'Average' : moment(d.date, 'YYYY-MM-DD').format('ddd Do MMM')}
              </button>
            </h2>
          </div>
        
          <div id="mealCardCalsBody${i}" class="collapse show">
            <div class="card-body">
              ${d.isSum ? sumBody() : dayBody()}
            </div>
          </div>
        </div>
    `
};


const macrosCard = (d, i) => {
    const macroG = d.isSum ? d.macros : Object.fromEntries(MACROS.map(macro => [macro, sum(d.elements.map(el => el.macros[macro]))]))
    const macroCals = Object.fromEntries(MACROS.map(macro => [macro, MACRO_CAL_MAP[macro] * macroG[macro]]))
    const totalCals = sum(Object.values(macroCals))
    return `
        <div class="card">
          <div class="card-header" id="mealCardMacrosHead${i}">
            <h2 class="mb-0">
              <button class="btn btn-link btn-block" type="button" data-toggle="collapse" data-target="#mealCardMacrosBody${i}">
                macros
              </button>
            </h2>
          </div>
      
          <div id="mealCardMacrosBody${i}" class="collapse show">
            <div class="card-body">
              ${MACROS.map(macro => `
                <div>${macro}: ${mR(100*macroCals[macro]/totalCals)}% - ${mR(macroG[macro])}g</div>
              `).join('')}
            </div>
          </div>
        </div>
    `
};

const getSum = days => {
    const len = days.length;
    let calsTot = 0;
    const mealMap = {breakfast: 0, lunch: 0, dinner: 0, snacks: 0};
    const macroMap = {carbs: 0, fat: 0, protein: 0};  // these are in grams
    for (let d of days) {
        for (let el of d.elements) {
            calsTot += el.calories;
            mealMap[el.type] += el.calories;
            for (let m of MACROS) {
                macroMap[m] += el.macros[m]
            }
        }
    }
    const calsAvg = Math.round(calsTot / len);
    for (let mt of mealTypes) mealMap[mt] = {avg: Math.round(mealMap[mt] / len), tot: mealMap[mt]};
    return {
        isSum: true,
        avg: calsAvg,
        tot: calsTot,
        ...mealMap,
        macros: macroMap,
    }
};


const _weekPlan = (_days, editable) => {  // TODO need to add ids in here
    const days = [ ..._days ];
    if (days.length > 1) {
        days.push(getSum(days))
    }

    return `
        <div class="mealDaysContainer editable">
            ${days.map((d, i) => {
                return `
                  <div class="cardContainer">
                    ${caloriesCard(d, i)}
                    
                    ${macrosCard(d, i)}
                  </div>
                `
            }).join('')}
        </div>
    `
};


export const editableWeekPlan = days => _weekPlan(days, true);
export const readonlyWeekPlan = days => _weekPlan(days, false);