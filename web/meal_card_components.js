import { MACROS, MACRO_CAL_MAP } from "./mealplan_config.js";
import { nextId, sum, avg, percent, strMap, Mr } from "./utils.js"
import { _assignState } from "./main.js";


export const PLAN_BUFFER = 40;  // px

const mealTypes = ['breakfast', 'lunch', 'dinner', 'snacks'];


const sbFlex = (x, y) => {
    return `<div class="sbFlexMCC"><div>${x}</div><div>${y}</div></div>`
};


const relIngCals = ing => Math.round(ing.qty * ing.basis.calories);

const mealItemCals = mi => mi.ingredients ? sum(mi.ingredients.map(ing => relIngCals(ing))) : mi.calories;

const mealItemMacroCals = (mi, macro) => mi.ingredients ?
        sum(mi.ingredients.map(ing => ing.qty * ing.basis.macros[macro] * MACRO_CAL_MAP[macro])) :
        ((mi.macros[macro]/100) * mi.calories);


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


const getQtyInput = (val, id, ids, editable) => {
    if (!editable) {
        return val
    }
    // return  `<span contenteditable="true" id="qty-${id}-${ids.join('-')}">${val}</span>`
    return  `
        <input name="qty-${id}-${ids.join('-')}" value="${val}" class="temp">
    `
};


const caloriesCard = (id, d, i, editable) => {
    const dayBody = () => {
        const mealMap = {breakfast: [], lunch: [], dinner: [], snacks: []};
        d.elements.map((el, ii) => mealMap[el.type.toLowerCase()].push({ ...el, ii: ii }));
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
                    `<div>${mm.name}</div><div class="mealItemQty">${getQtyInput(mm.qty, id, [i,mm.ii], editable)} ${mm.unit || mm.name}</div>`,
                    mealItemCals(mm)
                ),
                mm.ingredients && strMap(mm.ingredients, (ing) => {
                    return `
                        <div class="mealItemIng">${sbFlex(
                            `<div>${ing.name}</div><div class="mealItemQty">${Mr(ing.qty * ing.basis.qty, 3)} ${ing.basis.unit || ing.name}</div>`,
                            relIngCals(ing)
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
    const totalCals = d.elements && sum(d.elements.map(el => mealItemCals(el)));
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
              ${strMap(MACROS, macro => `
                <div>${macro}: ${d.isSum ? d.macros[macro] : percent(sum(d.elements.map(el => mealItemMacroCals(el, macro))), totalCals)}%</div>
              `)}
            </div>
          </div>
        </div>
    `
};

const getSum = (days, plan) => {
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

    container.html( `
        <div id="mdc-${id}" class="mealDaysContainer${editable ? ' editable': ''}">
            ${strMap(days, (d, i) => {
                return `
                  <div class="cardContainer">
                    ${caloriesCard(id, d, i, editable)}
                    
                    ${macrosCard(id, d, i)}
                  </div>
                `
            })}
        </div>
    `);
    addMealCardEvents(id, state, loc);
};


const addMealCardEvents = (id, state, loc) => {
    const dupe = obj => $.isArray(obj) ? [ ...obj ] : { ...obj };

    const handleCollapse = (e, collapsed) => {
            const uiLoc = $(e.target).data('uiloc').split('-');
            let node = state;
            for (let l of [ ...loc, ...uiLoc ]) node = node[l];
            if (node.collapsed !== collapsed) node.collapsed = collapsed;
    };

    $('[data-uiloc]')
        .on('show.bs.collapse', e => handleCollapse(e, false))
        .on('hide.bs.collapse', e => handleCollapse(e, true ));

    $(`${getContId(id)} input`).change(e => {  // TODO maybe make this oninput or something
        const [ type, _id, ...ids ] = e.target.name.split('-');
        const newState = { ...state };
        console.log('onchange:', e.target.name, e.target.value, loc);

        // convoluted duplication of relevant nodes of the state tree
        let node = newState;
        for (let l of loc) {
            node[l] = dupe(node[l]);
            node = node[l]
        }
        ids.forEach((i, k) => {
            const key = k === 0 ? 'days' : k === 1 ? 'elements' : 'ingredients';
            for (let idx of [key, i]) {
                node[idx] = dupe(node[idx]);
                node = node[idx];
            }
        });
        const oldVal = node[type];
        const newVal = +e.target.value;  // TODO validate the input
        const factor = newVal / oldVal;
        node[type] = newVal;
        if (node.ingredients) {
            node.ingredients = dupe(node.ingredients);
            node.ingredients.forEach((ing, i) => {
                node.ingredients[i] = dupe(node.ingredients[i]);
                node.ingredients[i][type] = factor * node.ingredients[i][type]
            })
        }
        if (node.calories) {
            node.calories = node.calories * factor
        }
        updateMCCState(state, newState, id, loc, true)
    });

    computeMCCStyles();
};


const computeMCCStyles = () => {
    const totWidth = window.screen.width;
    const cardMargins = 6 * 7;  // 6px * 7 spaces
    const cardWidth = (totWidth - (PLAN_BUFFER * 2) - cardMargins - 2 - 8) / 8;
    $('.mealDaysContainer .cardContainer').css({'min-width': `${cardWidth}px`, 'max-width': `${cardWidth}px`});
};

const updateMCCState = (state, newState, id, loc, editable) => {
    _assignState(newState);
    _renderWeekPlan(id, state, loc, editable)
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