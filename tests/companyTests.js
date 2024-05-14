import LinkedInAPIClass from "../index.js";
import fs from 'fs';

const LAPI = new LinkedInAPIClass(true);

const o = JSON.parse(fs.readFileSync('config.json'));
await LAPI.login(o.email, o.password);

async function smallTest() {
    const c = (await LAPI.searchCompanies('microsoft', [5001], 20, 0, true, true)).find(o => (o.name === 'Microsoft'));
    console.log(c);

    const managers = await c.searchEmployees('manager', 20);
    console.log(managers, managers.length);
}


async function largeTest() {
    const c = (await LAPI.searchCompanies('marukai', null, 1, 0, true, true)).find(o => (o.name === 'Marukai Corporation U.S.A.'));
    console.log(c);

    console.log(await c.getEmployees());

    const managers = await c.searchEmployees('manager');
    console.log(managers, managers.length);
}


largeTest();