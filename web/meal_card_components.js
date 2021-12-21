import { MACROS, MACRO_CAL_MAP } from "./mealplan_config.js";
import { nextId, sum, avg, percent, strMap, mR, createMacroDonut } from "./utils.js"
import { _assignState } from "./main.js";
export const PLAN_BUFFER = 40;  // px

const mealTypes = ['breakfast', 'lunch', 'dinner', 'snacks'];


const sbFlex = (a, b, classes='') => {
    return `<div class="sbFlexMCC ${classes}"><div>${a}</div><div>${b}</div></div>`
};

const macroBreakdown = m => {  /** m is either Array of meal items, or Object of macro grams */
    const macroG = Array.isArray(m) ? Object.fromEntries(MACROS.map(macro => [macro, sum(m.map(el => mealItemMacroG(el, macro)))])) : m
    const macroCals = Object.fromEntries(MACROS.map(macro => [macro, MACRO_CAL_MAP[macro] * macroG[macro]]))
    const totalCals = sum(Object.values(macroCals))
    if (!totalCals) {
        return {}
    }
    const percents = Object.fromEntries(MACROS.map(macro => [macro, percent(macroCals[macro], totalCals)]))
    const displayPercents = Object.fromEntries(MACROS.map(macro => [macro, mR(percents[macro])]))
    return {percents, displayPercents, macroG, macroCals, totalCals}
}

const macroBar = (mealItems, level) => {
    const { percents, displayPercents, macroG } = macroBreakdown(mealItems)
    if (!percents) {
        return ''
    }
    return `
<div class="macroBarCont macroBarLevel${level}">
    <div class="macroBar">
        <div style="width: ${percents.carbs}%;" class="macroBarPart macroBarC"></div>
        <div style="width: ${percents.fat}%;" class="macroBarPart macroBarF"></div>
        <div style="width: ${percents.protein}%;" class="macroBarPart macroBarP"></div>
    </div>
    <div class="macroBarDetailed">
        ${strMap(MACROS, macro => `<div>
            <span class="macroBarLeg macroBarLeg${macro[0].toUpperCase()}">${macro[0].toUpperCase()}</span>
            <span>${displayPercents[macro]}% ${mR(macroG[macro])}g</span>
        </div>`)}
    </div>
</div>
`
}


// TODO these assume one level of nested ingredients. may have to eventually change to recursive querying
const relIngCals = ing => mR(ing.qty * ing.basis.calories);

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
             `<div class="mealTypeHead">
                          ${sbFlex(mt, `<span>${mR(sum(mealMap[mt].map(mm => mealItemCals(mm))))}</span>`)}
                          ${macroBar(mealMap[mt], 1)}
                      </div>`,
            strMap(mealMap[mt], mm => collapsible(
                sbFlex(
                    `<div>${mm.name}</div><div class="mealItemQty">${getQtyInput(mm.qty, id, [i,mm.ii], editable, stateUI)}${mm.unit || mm.name}</div>`,
                    mR(mealItemCals(mm))
                ) + macroBar([mm], 2),
                mm.ingredients && strMap(mm.ingredients, (ing, iii) => {
                    return `
                        <div class="mealItemIng">${sbFlex(
                            `<div>${ing.name}</div>
                                <div class="mealItemQty">
                                    ${getQtyInput(mR(ing.qty * ing.basis.qty, 3), id, [i, mm.ii, iii], editable, stateUI)}${ing.basis.unit || ing.name}
                                </div>`,
                            mR(relIngCals(ing))
                        )}
                        ${macroBar(ing.basis.macros, 3)/* TODO remember to update this to show correct ing grams */}
                        </div>
                    `
                }),
                ['days', i, 'elements', mm.ii, 'ui'], mm.ui.collapsed, ['mealItem']
            )), 
            ['days', i, 'ui', mt], d.ui[mt].collapsed, ['mealTypeContainer'],
          ))}
    `};
    const sumBody = () => `
        <div class="mealTypeContainer">
          <div class="mealTypeHead">${sbFlex('AVERAGE', `<span>${mR(d.avg)}</span>`)}</div>
          <div class="mealItem">${sbFlex('total', `<span>${mR(d.tot)}</span>`)}</div>
        </div>
        ${strMap(mealTypes, mt => `
            <div class="mealTypeContainer">
              <div class="mealTypeHead">
                  ${sbFlex(mt, `<span>${mR(d[mt].avg)}</span>`)}
                  ${macroBar(d.mealMacros[mt], 1)}
              </div>
              <div class="mealItem">${sbFlex('total', `<span>${mR(d[mt].tot)}</span>`)}</div>
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
    const { percents, displayPercents, macroG } = macroBreakdown(d.isSum ? d.macros : d.elements)
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
              <div>${createMacroDonut(percents)}</div>
              ${strMap(MACROS, macro => `
                  <div class="sbFlexMCC">
                      <div><span class="macroBarLeg macroBarLeg${macro[0].toUpperCase()}"></span><span>${macro}</span></div>
                      ${sbFlex(displayPercents[macro]+'%', mR(macroG[macro])+'g', 'macroCardDetails')}
                  </div>
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
    const macroMap = {carbs: 0, fat: 0, protein: 0};  // these are in grams
    const mealMacroMap = Object.fromEntries(Object.keys(mealMap).map(k => [k, { ...macroMap }]))
    for (let d of days) {
        for (let el of d.elements) {
            const cals = mealItemCals(el);
            calsTot += cals;
            mealMap[el.type] += cals;
            for (let m of MACROS) {
                const macroG = mealItemMacroG(el, m)
                macroMap[m] += macroG
                mealMacroMap[el.type][m] += macroG
            }
        }
    }
    const calsAvg = mR(calsTot / len);
    for (let mt of mealTypes) mealMap[mt] = {avg: mR(mealMap[mt] / len), tot: mealMap[mt]};
    return {
        isSum: true,
        avg: calsAvg,
        tot: calsTot,
        ...mealMap,
        macros: macroMap,
        mealMacros: mealMacroMap,
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
        <div>
            <input type="checkbox" id="mdc-${id}-ViewMacros">
            <label for="mdc-${id}-ViewMacros">view macros</label>
            <input type="checkbox" id="mdc-${id}-ViewMacrosDetailed">
            <label for="mdc-${id}-ViewMacrosDetailed">detailed</label>
        </div>
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

    const uiState = (uiLoc, key, val) => {
        /** mutates the state! */
        // TODO - consider making this func a global util. the state mutate should be handled better (but no need to trigger a rerender?)
        let node = state;
        for (let l of uiLoc) node = node[l];
        if (val !== undefined) {
            if (node[key] !== val) node[key] = val;
            return
        }
        return node[key]
    }

    const handleCollapse = (e, collapsed) => {
        e.stopPropagation()
        const uiLoc = $(e.target).data('uiloc').split('-');
        uiState([ ...loc, ...uiLoc ], 'collapsed', collapsed)
    };

    $(`#mdc-${id} [data-uiloc]`)
        .on('show.bs.collapse', e => handleCollapse(e, false))
        .on('hide.bs.collapse', e => handleCollapse(e, true ))

    const toggleViewMacroBars = (name, cond) => { $(`#mdc-${id} .macroBar${name}`)[`${cond ? 'remove' : 'add'}Class`]('hidden') }

    const viewMacros = uiState([ ...loc, 'ui' ], 'viewMacros')
    toggleViewMacroBars('Cont', viewMacros)
    $(`#mdc-${id}-ViewMacros`).change(e => {
        uiState([ ...loc, 'ui' ], 'viewMacros', e.target.checked)
        toggleViewMacroBars('Cont', e.target.checked)
    }).prop('checked', viewMacros)

    const viewMacrosDetailed = uiState([ ...loc, 'ui' ], 'viewMacrosDetailed')
    toggleViewMacroBars('Detailed', viewMacrosDetailed)
    $(`#mdc-${id}-ViewMacrosDetailed`).change(e => {
        uiState([ ...loc, 'ui' ], 'viewMacrosDetailed', e.target.checked)
        toggleViewMacroBars('Detailed', e.target.checked)
    }).prop('checked', viewMacrosDetailed)

    addQtyInputEvents(id, state, loc);

    computeMCCStyles();
};

const addQtyInputEvents = (id, state, loc) => {  // TODO... this is all very convoluted?
    const dupe = obj => $.isArray(obj) ? [ ...obj ] : { ...obj };

    const numValidator = /^\d*\.?\d*$/;

    $(`${getContId(id)} [contenteditable]`).click(function(e) {
        e.stopPropagation();
    }).focus(function() {
        const $this = $(this);
        $this.data('before', $this.text());
    }).keydown(function(e) {
        if (e.key === 'Enter') {
            $(this).blur();
        }
    }).on('keyup paste', function() {
        const $this = $(this);
        const range = window.getSelection().getRangeAt(0);
        const oldVal = $this.data('before');
        const rawVal = $this.text();
        const newVal = $this.text().trim();

        if (rawVal !== newVal) {
            const newOffset = range.startOffset - (rawVal.length - newVal.length);
            $this.text(newVal);
            range.setStart((newVal ? range.startContainer.childNodes[0] : range.startContainer), newOffset);
        }

        if (oldVal !== newVal && +oldVal !== +newVal) {
            if (!numValidator.test(newVal)) {
                const newOffset = range.startOffset - (newVal.length - oldVal.length);
                $this.text(oldVal);
                range.setStart(range.startContainer.childNodes[0], newOffset)
            }
            else if (+newVal) {
                state.ui = {
                    ...state.ui,
                    caretPos: range.startOffset,
                    focused: range.startContainer.parentNode.id,
                    valInEdit: newVal,
                };
                $this.change();
            }
        }
    }).blur(function() {
        state.ui = {
            ...state.ui,
            caretPos: null,
            focused: null,
            valInEdit: null,
        };
        const $this = $(this);
        const newVal = $this.text();
        if (!numValidator.test(newVal) || !+newVal) {
            $this.text($this.data('before'))
        }
        $this.change();
    }).change(function(e) {
        const [ type, _id, ...ids ] = e.target.id.split('-');
        const newState = { ...state };

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
        const newVal = +e.target.innerText / (node.basis ? node.basis.qty : 1);
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
};


const computeMCCStyles = () => {
    const totWidth = window.screen.width;
    const cardMargins = 6 * 7;  // 6px * 7 spaces
    const cardWidth = (totWidth - (PLAN_BUFFER * 2) - cardMargins - 2 - 8) / 8;
    $('.mealDaysContainer .cardContainer').css({'min-width': `${cardWidth}px`, 'max-width': `${cardWidth}px`});
};

const updateMCCState = (state, newState, id, loc, editable) => {
    _assignState(newState);
    _renderWeekPlan(id, state, loc, editable);
    _updateUI(state);
};

const _updateUI = state => {
    if (state.ui.focused) {
        const node = $(`#${state.ui.focused}`);
        const range = document.createRange();
        range.setStart(node.contents()[0], state.ui.caretPos);
        node.focus();
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
    }
};

export const addUIState = (plan) => {
    plan['ui'] = {
        'caloriesSum': {collapsed: false},
        'macrosSum':   {collapsed: false},
        'viewMacros': false,
        'viewMacrosDetailed': false,
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
