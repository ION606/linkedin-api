import LinkedInAPIClass from "../index.js";
import fs from 'fs';

(async () => {
    const LAPI = new LinkedInAPIClass(true);

    const o = JSON.parse(fs.readFileSync('config.json'));
    await LAPI.login(o.email, o.password);

    const c = (await LAPI.searchCompanies('microsoft', [5001], 20, 0, true, true)).find(o => (o.name === 'Microsoft'));
    console.log(c);
    
    const managers = await c.searchEmployees('manager');
    console.log(managers, managers.length);
})();