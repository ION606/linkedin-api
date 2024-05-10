import LinkedInAPIClass from "../index.js";
import fs from 'fs';

(async () => {
    const LAPI = new LinkedInAPIClass();

    const o = JSON.parse(fs.readFileSync('config.json'));
    await LAPI.login(o.email, o.password);

    const c = await LAPI.searchCompanies('microsoft', [10, 500, 5000], 0, true, true);
    
    console.log(c);
    
    const managers = await c.find(o => (o.name === 'Microsoft')).searchEmployees('manager', 5);
    console.log(managers, managers.length);
})();