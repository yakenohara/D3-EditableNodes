var obj_xPathUtil = require('./common/xpath-util');

const obj_user_impli = {
    VAR_NAME:'memo0',
    ELEM_ID_BINDED:'force-memo0'
};

const obj_xpath_defs = {
    
    // <text>
    NODE_TEXT:
        `//div[@id="${obj_user_impli.ELEM_ID_BINDED}"]` +
            `/*[name()="svg" and ${obj_xPathUtil.func_genPredcateExpr_isExistsInClassList('SVGForNodesMapping')}]` +
                `/*[name()="g" and ${obj_xPathUtil.func_genPredcateExpr_isExistsInClassList('nodes')}]` + 
                    `/*[name()="g" and ${obj_xPathUtil.func_genPredcateExpr_isExistsInClassList('node')}]` +
                        `/*[name()="text" and ${obj_xPathUtil.func_genPredcateExpr_isExistsInClassList('textContent')}]`
    ,

    // <ellipse>
    NODE_ELLIPSE:
        `//div[@id="${obj_user_impli.ELEM_ID_BINDED}"]` +
            `/*[name()="svg" and ${obj_xPathUtil.func_genPredcateExpr_isExistsInClassList('SVGForNodesMapping')}]` +
                `/*[name()="g" and ${obj_xPathUtil.func_genPredcateExpr_isExistsInClassList('nodes')}]` + 
                    `/*[name()="g" and ${obj_xPathUtil.func_genPredcateExpr_isExistsInClassList('node')}]` +
                        `/*[name()="g" and ${obj_xPathUtil.func_genPredcateExpr_isExistsInClassList('frame')}]` +
                            `/*[name()="ellipse"]`
    ,

    // 最後の history (selected)
    HISTORY_LAST_AND_SELECTED:
        `//div[@id="${obj_user_impli.ELEM_ID_BINDED}"]` +
            `/div[${obj_xPathUtil.func_genPredcateExpr_isExistsInClassList('transactionHistory')}]` +
                `/div[${obj_xPathUtil.func_genPredcateExpr_isExistsInClassList('transaction')} and last() and ${obj_xPathUtil.func_genPredcateExpr_isExistsInClassList('selected')}]`

}

module.exports.DEPENDS_ON_USER_IMPLI = obj_user_impli;
module.exports.XPATH_DEF = obj_xpath_defs;
