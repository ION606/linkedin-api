import fs from 'fs';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';
import axiosModule from 'axios';
import { LinkedInProfile, Company, GenericEntity, Group, SocialActivityCounts } from '../index.js';
import { LoadingBar } from './misc.js';


const cookieJar = new CookieJar();
const axios = wrapper(axiosModule.create({
    jar: cookieJar, // attach cookie jar
    withCredentials: true
}));


export const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
export const randomIntFromInterval = (boundLower, boundUpper) => Math.floor(Math.random() * (boundUpper - boundLower + 1) + boundLower);
export const inRange = (inp, minAmt, maxAmt) => (inp >= minAmt && inp <= maxAmt);


/**
 * Function to dynamically create class instances based on type
 * @param {Object[]} included
 * @param {linkedInAPIClass} APIRef
 * @param {boolean} [excludeGeneric=false] whether or not to exclude any object that does not exactly fit the Company type
 * @returns {[SocialActivityCounts | Group | Company | GenericEntity]}
 */
function parseIncludedData(included, APIRef, excludeGeneric = false) {
    const classMap = {
        'com.linkedin.voyager.dash.feed.SocialActivityCounts': SocialActivityCounts,
        'com.linkedin.voyager.dash.groups.Group': Group,
        "com.linkedin.voyager.dash.search.EntityResultViewModel": Company,
        // 'com.linkedin.voyager.dash.organization.Company': Company,
        'default': GenericEntity // Default class for any other type
    },
        toIgnore = {
            "com.linkedin.voyager.dash.search.FeedbackCard": -1,
            "com.linkedin.voyager.dash.search.LazyLoadedActions": -1,  // companies again
            'com.linkedin.voyager.dash.organization.Company': -1
        }

    return included.map(item => {
        const EntityClass = classMap[item.$type] || toIgnore[item.$type] || classMap['default'];
        if (EntityClass === -1) return;

        // ignore the strange companies like "linkedIn pages"
        // if (!item.name) return null;

        // APIRef may be ignored here
        return new EntityClass(item, APIRef);
    }).filter(o => (excludeGeneric && (o instanceof Company)) || (!excludeGeneric && o));
}


export async function parseResponse(data, APIRef, excludeGeneric) {
    const jsonData = (typeof data === 'string') ? JSON.parse(data) : data;
    const includedData = jsonData.included || [];
    return parseIncludedData(includedData, APIRef, excludeGeneric);
}


function findRangeIndex(number) {
    const rangeMap = ["B", "C", "D", "E", "F", "G", "H", "I"];
    const companySizeRanges = [
        [1, 10],
        [11, 50],
        [51, 200],
        [201, 500],
        [501, 1000],
        [1001, 5000],
        [5001, 10000],
        [10001, Infinity],
    ];
    for (let i = 0; i < companySizeRanges.length; i++) {
        const [lowerBound, upperBound] = companySizeRanges[i];
        if (number >= lowerBound && number <= upperBound) {
            return rangeMap[i];
        }
    }

    return -1;
}


/**
 * @returns {String}
 * @param {Array<String>} nums
 */
export function numsToSizes(...nums) {
    if (nums.length > 8) throw "MUST PROVIDE A 8 OR LESS RANGES";

    const ranges = nums.map(findRangeIndex);
    if (ranges.includes(-1)) throw `${nums} CONTAINS AN INVALID RANGE!`;
    return `[${ranges.join(",")}]`;
}


/**
 * @returns {String}
 * @param {Array<1 | 2 | 3>} nums 
 */
export const numToConDegs = (nums) => nums.map((n) => {
    if (n === 1) return "F";
    else if (n === 2) return "S";
    else if (n === 3) return "O";
    else return null;
}).filter(o => o);


// a "collection" of helper functions
class APIHelper {
    parseCookiesToMap(cookies) {
        const cookieMap = new Map();
        cookies.forEach(cookie => {
            const parts = cookie.split(';'); // Split cookie string into parts by ';'
            const firstPart = parts[0]; // The first part contains the name and value
            const [name, value] = firstPart.split('='); // Split the first part to get name and value
            cookieMap.set(name.trim(), value.trim().replace(/"/g, '')); // Trim and remove quotes, then add to map
        });
        return cookieMap;
    }


    getCookies(username, password) {
        return new Promise(async (resolve, reject) => {
            const spawn = (await import("child_process")).spawn;
            const pythonProcess = spawn('python', ["auth.py", username, password]);
            pythonProcess.stdout.on('data', (data) => resolve(data.toString()));
        });
    }

    /**
     * @deprecated
     */
    async getCookiesOld(username, password) {
        const authurl = 'https://www.linkedin.com/uas/authenticate'
        const res = await axios.get(authurl, {
            headers: this.authheaders
        });

        const scookie = this.parseCookiesToMap(res.headers['set-cookie']);

        const payload = {
            session_key: username,
            session_password: password,
            JSESSIONID: scookie.get('JSESSIONID')
        };

        console.log(payload);

        // this.authheaders['cookies'] = res.headers['set-cookie'];

        try {
            const response = await axios.post(
                authurl,
                payload,
                {
                    withCredentials: true,
                    headers: this.authheaders,
                    cookies: cookieJar
                    // Commenting out the proxy setting as Axios requires special handling for proxies
                    // proxy: proxies
                }
            );

            console.log(response.headers);
            return response.data;
        } catch (error) {
            console.log(error);
            console.error('Error during authentication:', error.response ? error.response.data : error.message);
        }
    }

    constructor() {
        this.authheaders = {
            "X-Li-User-Agent": "LIAuthLibrary:0.0.3 com.linkedin.android:4.1.881 Asus_ASUS_Z01QD:android_9",
            "User-Agent": "ANDROID OS",
            "X-User-Language": "en",
            "X-User-Locale": "en_us",
            "Accept-Language": "en-us"
        }
    }
}


export default class linkedInAPIClass {
    /**
     * A function to try and trick the LinkedIn API rate limit/bot detector
     */
    evade = () => wait(randomIntFromInterval(2, 5) * 1000);

    /**
    * @param {String} keyword i.e. "biotechnology"
    * @param {Array<Number>?} numEmp
    * @param {Number?} [limit=1000] the function will use the bound the given number is contained in (see {@link findRangeIndex} for ranges)
    * @param {Number?} [start=0]
    * @param {boolean?} [castToClass=true] whether the function should return a list of Company classes or just raw JSON
    * @param {boolean} [excludeGeneric=false]
    * @returns {Promise<[SocialActivityCounts | Group | Company | GenericEntity]>}
    */
    async searchCompanies(keyword, numEmp = undefined, limit = 1000, start = 0, castToClass = true, excludeGeneric = false) {
        const compAll = [];

        if (this.logAll) console.log(`scanning for ${limit} companies with the keyword "${keyword}"`);

        const lb = (this.logAll) ? new LoadingBar(Math.round(limit / 50)) : null;

        for (let i = start; i < limit; i += 50) {
            let urlExt = `variables=(start:${i},origin:GLOBAL_SEARCH_HEADER,query:(keywords:${keyword},flagshipSearchIntent:SEARCH_SRP,queryParameters:List((key:resultType,value:List(COMPANIES))${(numEmp) ? `,(key:companySize,value:List(${numsToSizes(...numEmp)}))` : ''}),includeFiltersInResponse:false))`;
            const r = await this._makeReq(urlExt);

            if (this.logAll) lb.increment();

            if (!r?.included && r?.data?.errors) {
                console.error(JSON.stringify(r.data.errors))
                throw "ERROR!";
            }

            if (!castToClass) compAll.push(r);
            else compAll.push(await parseResponse(r, this, excludeGeneric));

            await this.evade();
        }

        return compAll.flat();
    }


    /**
     * @returns {Promise<LinkedInProfile[]>}
     * @param {String} keyword the user to search for
     * @param {Number?} [limit=1000] the function will use the bound the given number is contained in (see {@link findRangeIndex} for ranges)
     * @param {boolean?} [castToClass=true] whether the function should return a list of Company classes or just raw JSON
     * @param {boolean} [filterObfuscated=true] where or not to filter out members with obfuscated profiles ("LinkedIn Member")
     * @param {Array<String>?} currentCompanies
     * @param {Array<1 | 2 | 3>?} conDeg the level(s) of connection to include (defults to all)
     * @example
     * // search for "John Appleseed" (who works at github), but only the first 50 results who are also first connections
     * LAPI.searchEmployees("John Appleseed", 50, true, ["1418841"], [1])
     */
    async searchEmployees(keyword, limit = 1000, castToClass = true, filterObfuscated = true, currentCompanies = [], conDeg = []) {
        const empAll = [],
            lb = (this.logAll) ? new LoadingBar(Math.floor(limit/10)) : null;

        for (let i = 0; empAll.length < limit; i += 50) {
            let urlExt = `includeWebMetadata=true&variables=(start:${i},query:(keywords:${keyword},flagshipSearchIntent:SEARCH_SRP,queryParameters:List((key:resultType,value:List(PEOPLE))`;

            if (currentCompanies.length) urlExt += `,(key:currentCompany,value:List(${currentCompanies.join(',')}))`;
            if (conDeg.length) urlExt += `,(key:network,value:List(${numToConDegs(conDeg)}))`;
            urlExt += ')))';

            const r = await this._makeReq(urlExt);
            
            if (this.logAll) lb.increment(5);

            // there's nothing left, returns what we have
            if (!r?.included?.length) {
                if (!castToClass) return empAll;
                else return empAll.map(o => new LinkedInProfile(o, this));
            }

            // profiles with no info can be useless
            const filtered = r.included.filter(e => {
                if (!filterObfuscated) return e.template === 'UNIVERSAL';
                else return (e.template === 'UNIVERSAL' && e.title.text !== 'LinkedIn Member');
            });

            if (filtered.length) empAll.push(...filtered);
            await this.evade();
        }

        if (!castToClass) return empAll;
        else return empAll.map(o => new LinkedInProfile(o, this));
    }


    /**
     * @param {String} reqPath 
     * @returns {Promise<Buffer | null>}
     * @throws The promise will reject on error
     */
    async _makeReq(reqPath, isProfile = false) {
        await this.evade();
        const res = await axios.get(`https://www.linkedin.com/voyager/api/graphql?${reqPath}&queryId=${(!isProfile) ? "voyagerSearchDashClusters.f0c4f21d8a526c4a5dd0ae253c9b6e02" : "voyagerIdentityDashProfiles.5a6722404e6afd08958f5105e51cad51"}`, { headers: this.headers }).catch((err) => {
            console.error(err);
            return null;
        });

        return res?.data;
    }

    // attempts to use cookies and otherwise uses auth
    async login(username, password) {
        let cookie;
        if (this.resetCookies || !fs.existsSync("cookie.txt")) {
            cookie = await this.helper.getCookies(username, password);
            if (this.logAll) console.log(cookie);

            if (cookie['login_result'] == "CHALLENGE") throw `\n\nIP IS NOT AUTHORIZED, PLEASE LOG IN THROUGH YOUR BROWSER USING:\nusername: ${username}\npassword: ${password}\n\n`;
            if (cookie['login_result'] != "PASS") throw cookie;

            // const sessioncookie = await this.#getCookies();
            // throw "NO COOKIE FOUND!";
        } else cookie = fs.readFileSync('cookie.txt');

        if (this.logAll) console.log("LOGGED IN!");

        this.headers = {
            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:124.0) Gecko/20100101 Firefox/124.0',
            'Accept': 'application/vnd.linkedin.normalized+json+2.1',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'x-li-lang': 'en_US',
            'x-li-track': '{"clientVersion":"1.13.14725","mpVersion":"1.13.14725","osName":"web","timezoneOffset":-7,"timezone":"America/Los_Angeles","deviceFormFactor":"DESKTOP","mpName":"voyager-web","displayDensity":1,"displayWidth":1920,"displayHeight":1080}',
            'x-li-page-instance': 'urn:li:page:d_flagship3_search_srp_jobs;TvndZ7TATTy2i/ZUyyD3Zg==',
            'csrf-token': 'ajax:2538600735149500238',
            'x-restli-protocol-version': '2.0.0',
            'x-li-pem-metadata': 'Voyager - Organization - LCP_Member=interest-pipeline',
            'Connection': 'keep-alive',
            'Referer': 'https://www.linkedin.com/jobs/search/?currentJobId=3840672849&distance=25.0&geoId=103644278&keywords=temp&origin=HISTORY',
            'Cookie': cookie,
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-origin',
            'TE': 'trailers'
        };
    }

    constructor(logAll = false, resetCookies = false) {
        this.logAll = logAll;
        this.resetCookies = resetCookies;
        this.helper = new APIHelper();
    }
}