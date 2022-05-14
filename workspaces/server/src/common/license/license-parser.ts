import * as fs from "fs"
import * as crypto from "crypto"
import * as stringify from "json-stable-stringify"

export default class LicenseParser {
  static parse(options) {
    let publicKey;
    let licenseFile;

    if (!options.template)
      throw new Error('LicenseFile::parse: options.template is required');

    if (typeof options.publicKey === 'string')
      publicKey = options.publicKey;
    else if (typeof options.publicKeyPath === 'string')
      publicKey = fs.readFileSync(options.publicKeyPath, 'utf8');
    else throw new Error('LicenseFile::generate: publicKeyPath or publicKey is required');

    if (typeof options.licenseFile === 'string')
      licenseFile = options.licenseFile;
    else if (typeof options.licenseFilePath === 'string')
      licenseFile = fs.readFileSync(options.licenseFilePath, 'utf8');
    else throw new Error('LicenseFile::parse: licenseFilePath or licenseFile is required');

    const tokens = [];
    const regExpString = options.template.replace(/{{&(\w+)}}/g, (match, token) => {
      tokens.push(token);
      return '(.*)';
    });
    const result = licenseFile.match(new RegExp(regExpString));

    if (!result)
      throw new Error(`License file corrupted`);

    const dataObj: any = {
      data: {}
    };

    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i] === 'serial') dataObj[tokens[i]] = result[i + 1];
      else dataObj['data'][tokens[i]] = result[i + 1];
    }

    const verify = crypto.createVerify('RSA-SHA256');
    verify.update(stringify(dataObj.data));
    const valid = verify.verify(publicKey, dataObj.serial, 'hex');

    return {
      valid: valid,
      serial: dataObj.serial,
      data: dataObj.data
    };
  }
}