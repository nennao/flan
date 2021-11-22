import { MACROS, MACRO_CAL_MAP } from "./mealplan_config.js";
import { nextId, sum, avg, percent, strMap, mR } from "./utils.js"

export const PLAN_BUFFER = 40;  // px

const mealTypes = ['breakfast', 'lunch', 'dinner', 'snacks'];


const sbFlex = (a, b) => {
    return `<div class="sbFlexMCC"><div>${a}</div><div>${b}</div></div>`
};

// TODO these assume one level of nested ingredients. may have to eventually change to recursive querying
const relIngCals = ing => Math.round(ing.qty * ing.basis.calories);

const mealItemCals = mi => mi.ingredients ? sum(mi.ingredients.map(ing => relIngCals(ing))) : mi.calories;

const mealItemMacroG = (mi, macro) => mi.ingredients ?
    sum(mi.ingredients.map(ing => ing.qty * ing.basis.macros[macro])) :
    mi.macros[macro]


const collapsible = (heading, content, uiLoc, collapsed=true, classes=[]) => {
    if (!content) {
        return `<div class="${classes.join(' ')}">${heading}</div>`
    }
    const id = nextId();
    return `
        <div class="collapsible ${classes.join(' ')}">
            <div class="collapsibleHead" data-toggle="collapse" data-target="#${id}_collapsible">${heading}</div>
            <div class="collapsibleBody collapse${collapsed ? '' : ' show'}" id="${id}_collapsible" data-uiloc="${uiLoc.join('-')}">${content}</div>
        </div>
    `
};


const getQtyInput = (val, id, ids, editable, stateUI) => {
    if (!editable) {
        return val + ' '  // todo why + ' ' ???
    }
    const _id = `qty-${id}-${ids.join('-')}`;
    const _val = stateUI.focused === _id ? (stateUI.valInEdit || val) : val;
    return `<span class="qtyInput" contenteditable="true" id="${_id}">${_val}</span>`
};


const caloriesCard = (id, d, i, editable, stateUI) => {
    const dayBody = () => {
        const mealMap = {breakfast: [], lunch: [], dinner: [], snacks: []};
        d.elements.map((el, ii) => mealMap[el.type.toLowerCase()].push({ ...el, ii: ii }));  // todo "ii" ? :/
        return `
        <div class="mealTypeContainer">
          <div class="mealTypeHead">${sbFlex('TOTAL', `<span>${mR(sum(d.elements.map(el => mealItemCals(el))))}</span>`)}</div>
        </div>
        <div class="mealTypeContainer">
          <div class="mealTypeHead">${sbFlex('PLAN', `<span>${d.planType}</span>`)}</div>
        </div>
        ${strMap(mealTypes, mt => collapsible(
             `<div class="mealTypeHead">${sbFlex(mt, `<span>${mR(sum(mealMap[mt].map(mm => mealItemCals(mm))))}</span>`)}</div>`,
            strMap(mealMap[mt], mm => collapsible(
                sbFlex(
                    `<div>${mm.name}</div><div class="mealItemQty">${getQtyInput(mm.qty, id, [i,mm.ii], editable, stateUI)}${mm.unit || mm.name}</div>`,
                    mR(mealItemCals(mm))
                ),
                mm.ingredients && strMap(mm.ingredients, (ing, iii) => {
                    return `
                        <div class="mealItemIng">${sbFlex(
                            `<div>${ing.name}</div>
                                <div class="mealItemQty">
                                    ${getQtyInput(mR(ing.qty * ing.basis.qty, 3), id, [i, mm.ii, iii], editable, stateUI)}${ing.basis.unit || ing.name}
                                </div>`,
                            mR(relIngCals(ing))
                        )}</div>
                    `
                }),
                ['days', i, 'elements', mm.ii, 'ui'], mm.ui.collapsed, ['mealItem']
            )), 
            ['days', i, 'ui', mt], d.ui[mt].collapsed, ['mealTypeContainer'],
          ))}
    `};
    const sumBody = () => `
        <div class="mealTypeContainer">
          <div class="mealTypeHead">${sbFlex('AVERAGE', `<span>${mR(d.avg)}</span>`)}</span></div>
          <div class="mealItem">${sbFlex('total', `<span>${mR(d.tot)}</span>`)}</span></div>
        </div>
        ${strMap(mealTypes, mt => `
            <div class="mealTypeContainer">
              <div class="mealTypeHead">${sbFlex(mt, `<span>${mR(d[mt].avg)}</span>`)}</span></div>
              <div class="mealItem">${sbFlex('total', `<span>${mR(d[mt].tot)}</span>`)}</span></div>
            </div>
        `)}
    `;
    const uiLoc = d.isSum ? ['ui', 'caloriesSum'] : ['days', i, 'ui', 'calories'];

    return `
        <div class="card">
          <div class="card-header" id="${id}_mealCardCalsHead${i}">
            <h2 class="mb-0">
              <button class="btn btn-link btn-block" type="button" data-toggle="collapse" data-target="#${id}_mealCardCalsBody${i}">
                ${d.isSum ? 'Average' : moment(d.date, 'YYYY-MM-DD').format('ddd Do MMM')}
              </button>
            </h2>
          </div>
        
          <div id="${id}_mealCardCalsBody${i}" class="collapse${d.ui.calories.collapsed ? '' : ' show'}" data-uiloc="${uiLoc.join('-')}">
            <div class="card-body">
              ${d.isSum ? sumBody() : dayBody()}
            </div>
          </div>
        </div>
    `
};


const macrosCard = (id, d, i) => {
    const macroG = d.isSum ? d.macros : Object.fromEntries(MACROS.map(macro => [macro, sum(d.elements.map(el => mealItemMacroG(el, macro)))]))
    const macroCals = Object.fromEntries(MACROS.map(macro => [macro, MACRO_CAL_MAP[macro] * macroG[macro]]))
    const totalCals = sum(Object.values(macroCals))
    const uiLoc = d.isSum ? ['ui', 'macrosSum'] : ['days', i, 'ui', 'macros'];
    return `
        <div class="card">
          <div class="card-header" id="${id}_mealCardMacrosHead${i}">
            <h2 class="mb-0">
              <button class="btn btn-link btn-block" type="button" data-toggle="collapse" data-target="#${id}_mealCardMacrosBody${i}">
                macros
              </button>
            </h2>
          </div>
      
          <div id="${id}_mealCardMacrosBody${i}" class="collapse${d.ui.macros.collapsed ? '' : ' show'}" data-uiloc="${uiLoc.join('-')}">
            <div class="card-body">
              ${strMap(MACROS, macro => sbFlex(macro, `${percent(macroCals[macro], totalCals)}% - ${mR(macroG[macro])}g`))}
            </div>
          </div>
        </div>
    `
};

const getSum = (days, plan) => {
    const len = days.length;
    let calsTot = 0;
    const mealMap = {breakfast: 0, lunch: 0, dinner: 0, snacks: 0};
    const macroMap = {carbs: 0, fat: 0, protein: 0};  // these are in grams
    for (let d of days) {
        for (let el of d.elements) {
            const cals = mealItemCals(el);
            calsTot += cals;
            mealMap[el.type] += cals;
            for (let m of MACROS) {
                macroMap[m] += mealItemMacroG(el, m)
            }
        }
    }
    const calsAvg = Math.round(calsTot / len);
    for (let mt of mealTypes) mealMap[mt] = {avg: mR(mealMap[mt] / len), tot: mealMap[mt]};
    return {
        isSum: true,
        avg: calsAvg,
        tot: calsTot,
        ...mealMap,
        macros: macroMap,
        ui: {
            calories: plan.ui.caloriesSum,
            macros: plan.ui.macrosSum,
        },
    }
};

const getContId = id => `#${id}-mdcCont`;

const _getPlanFromState = (state, loc) => {
    let node = state;
    for (let l of loc) {
        if (!node) break;  // TODO what is this for?
        node = node[l]
    }
    return node
};

const _renderWeekPlan = (id, state, loc, editable) => {
    const container = $(getContId(id));

    const _plan = _getPlanFromState(state, loc);
    const _days = _plan.days;

    if (!_days || !_days.length) {
        container.html('error');  // TODO ???
        return
    }
    const days = [ ..._days ];

    if (days.length > 1) {
        days.push(getSum(days, _plan))
    }

    container.html(`
        <div id="mdc-${id}" class="mealDaysContainer${editable ? ' editable': ''}">
            ${strMap(days, (d, i) => {
                return `
                  <div class="cardContainer">
                    ${caloriesCard(id, d, i, editable, state.ui)}
                    
                    ${macrosCard(id, d, i)}
                  </div>
                `
            })}
        </div>
    `);
    addMealCardEvents(id, state, loc);
};


const addMealCardEvents = (id, state, loc) => {

    const handleCollapse = (e, collapsed) => {
        e.stopPropagation()
        /** mutates the state! */
        const uiLoc = $(e.target).data('uiloc').split('-');
        let node = state;
        for (let l of [ ...loc, ...uiLoc ]) node = node[l];
        if (node.collapsed !== collapsed) node.collapsed = collapsed;
    };

    $(`#mdc-${id} [data-uiloc]`)
        .on('show.bs.collapse', e => handleCollapse(e, false))
        .on('hide.bs.collapse', e => handleCollapse(e, true ))

    computeMCCStyles();
};


const computeMCCStyles = () => {
    const totWidth = window.screen.width;
    const cardMargins = 6 * 7;  // 6px * 7 spaces
    const cardWidth = (totWidth - (PLAN_BUFFER * 2) - cardMargins - 2 - 8) / 8;
    $('.mealDaysContainer .cardContainer').css({'min-width': `${cardWidth}px`, 'max-width': `${cardWidth}px`});
};

export const addUIState = (plan) => {
    plan['ui'] = {
        'caloriesSum': {collapsed: false},
        'macrosSum':   {collapsed: false},
    };
    for (let day of plan.days) {
        day['ui'] = {};
        for (let ct of ['calories', 'macros']) {
            day['ui'][ct] = {collapsed: false}
        }
        for (let mt of mealTypes) {
            day['ui'][mt] = {collapsed: false}
        }
        for (let el of day.elements) {
            el['ui'] = {collapsed: true}
        }
    }
    return plan
};

export const removeUIState = (_plan) => {
    // TODO feels like there should be a simpler way to do this
    const plan = { ..._plan };
    delete plan['ui'];
    const days = [];
    for (let _day of plan.days) {
        const day = { ..._day };
        delete day['ui'];
        const els = [];
        for (let _el of day.elements) {
            const el = { ..._el };
            delete el['ui'];
            els.push(el)
        }
        day.elements = els;
        days.push(day)
    }
    plan.days = days;
    return plan
};

export const editableWeekPlan = (id, state, loc) => _renderWeekPlan(id, state, loc,true);
export const readonlyWeekPlan = (id, state, loc) => _renderWeekPlan(id, state, loc,false);
