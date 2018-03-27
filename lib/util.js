const prettyjson = require('prettyjson');

var util = {
    prettify_json : (data, options) => {
                        return '{\n' + prettyjson.render(data, options) + '\n}';
                    },
    prettify_jsonObj: (jsonObj) => {
                        return util.prettify_json(JSON.stringify(jsonObj));
                    },
    format_jsonObj : (jsonObj) => {
                        return JSON.stringify(jsonObj, undefined, 2);
                    }
};

module.exports = util;