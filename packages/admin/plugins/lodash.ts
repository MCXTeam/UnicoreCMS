import Vue from 'vue'
import VueLodash from 'vue-lodash'
import * as _ from 'lodash'

_.mixin({
  'deepKeys': function (obj: any) {
    var keys: string[] = [];
    for (var key in obj) {
      keys.push(key);
      if (typeof obj[key] === "object") {
        var subkeys = (_ as any).deepKeys(obj[key]);
        keys = keys.concat(subkeys.map(function (subkey: any) {
          return key + "." + subkey;
        }));
      }
    }
    return keys;
  }
});

Vue.use(VueLodash, { name: '$_', lodash: _ })