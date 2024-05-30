import axios from "axios";
import * as cheerio from 'cheerio';
import linkedInAPIClass from "../index.js";
import { LinkedInProfile } from "./Profile.js";

export class Company {
    /** @type {linkedInAPIClass} */
    #APIRef;


    /**
     * gets the employees of a company
     * @param {Number} [limit=Infinity] to make things simpler I used increments of 50, so the limit is essentially ceiled to the nearest multiple of 50
     * @param {Boolean} [raw=false] whether or not you want the raw JSON returned
     * @returns {Promise<JSON[] | LinkedInProfile[]>}
     * @note This function skips over any employees who's profile is marked as private
     */
    async getEmployees(limit = Infinity, raw = false) {
        const employeesInit = await this.#APIRef._makeReq(`variables=(start:0,origin:FACETED_SEARCH,query:(flagshipSearchIntent:ORGANIZATIONS_PEOPLE_ALUMNI,queryParameters:List((key:currentCompany,value:List(${this.entityNum})),(key:resultType,value:List(ORGANIZATION_ALUMNI))),includeFiltersInResponse:true),count:1)`);

        const numEmp = employeesInit.data.data.searchDashClustersByAll.paging.total,
            empAll = [];

        // since the max cap is 50, we need to iterate until it's over 50
        for (let i = 0; i < numEmp; i += 50) {
            if (empAll.length >= limit || i >= numEmp) break;

            const c = (i + 50 >= numEmp) ? numEmp - i : 50;

            const employeeRes = await this.#APIRef._makeReq(`variables=(start:${i},origin:FACETED_SEARCH,query:(flagshipSearchIntent:ORGANIZATIONS_PEOPLE_ALUMNI,queryParameters:List((key:currentCompany,value:List(${this.entityNum})),(key:resultType,value:List(ORGANIZATION_ALUMNI))),includeFiltersInResponse:true),count:${c})`);
            const employees = employeeRes.included;

            const empParsed = employees.filter(e => (e.$type === "com.linkedin.voyager.dash.search.EntityResultViewModel"))
                .filter(o => o.title.text !== "LinkedIn Member");

            if (empParsed.length) empAll.push(...empParsed);
            await this.#APIRef.evade();
        }


        return (raw) ? empAll : empAll.map(eRaw => new LinkedInProfile(eRaw, this.#APIRef));
    }

    toObj() {
        return {
            data: {
                title: { text: this.name },
                entityUrn: this.urn,
                navigationUrl: this.url,
                trackingUrn: `urn:li:company:${this.entityNum}`
            }
        };
    }

    /**
     * @returns {Promise<JSON[] | LinkedInProfile[]>}
     * @param {string} name 
     * @param {boolean} castToClass
     * @param {number} limit
     * @note this function calls {@link linkedInAPIClass.searchEmployees}
     */
    searchEmployees = (name, limit = 1000, castToClass = true) => this.#APIRef.searchEmployees(name, limit, castToClass, [this.entityNum]);

    async getInfo() {
        const toAdd = `q=universalName&universalName=${this.urn}`;
        return await this.#APIRef._makeReq(toAdd);
    }

    checkIfCompleted = () => !!(this.name && this.url && this.urn && this.#APIRef);

    /**
     * @param {{title: {text: String}, entityUrn: String, navigationUrl: String}} data
     * @param {import('../index.js').linkedInAPIClass} APIRef 
     */
    constructor(data, APIRef) {
        this.#APIRef = APIRef;
        // this.entityUrn = entityUrn?.replace("urn:li:fsd_company:", "");
        this.name = data.title.text;
        this.urn = data.entityUrn;
        this.url = data.navigationUrl;
        this.entityNum = data.trackingUrn.replace('urn:li:company:', '');

        axios.get(this.url).then(r => {
            const $ = cheerio.load(r.data);
            const u = $('a[aria-describedby="websiteLinkDescription"]')?.attr('href')?.split('url=http')?.at(1)?.split('&')[0];
            if (u) this.websiteurl = `http${decodeURIComponent(u)}`;
        }).catch(_ => null);

        if (!this.checkIfCompleted()) throw "NOT ALL NEEDED PARAMS FOUND!";
    }
}