import { linkedInAPIClass } from "../index.js";

export class LinkedInProfile {
    /** @type {linkedInAPIClass} */
    #APIRef;

    /**
     * Attempts to get the contact info for the person
     * @returns {Promise<{websites: [{label:string, category:string, url:string}], emailAddress:string, phoneNumbers:[string],weChatContactInfo:any,twitterHandles:[string], instantMessengers:[]}>}
     */
    async getContactInfo() {
        const r = await this.#APIRef._makeReq(`includeWebMetadata=true&variables=(memberIdentity:${this.entityNameJoined})`, true);
        if (r?.data?.errors) return console.error(JSON.stringify(r.data.errors));
        const uObj = r.included.find(o => o.publicIdentifier === this.entityNameJoined);
        if (!uObj) return;
        let { phoneNumbers, emailAddress, websites, weChatContactInfo, twitterHandles, instantMessengers } = uObj;

        if (websites) websites = websites.map(w => ({ label: w.label, category: w.category, url: w.url }));
        return { phoneNumbers, emailAddress, websites, weChatContactInfo, twitterHandles, instantMessengers };
    }

    // Parse specific services offered, contained in the 'simpleInsight' section of 'insightsResolutionResults'
    parseServices(insights) {
        for (let insight of insights) {
            if (insight.simpleInsight && insight.simpleInsight.title && insight.simpleInsight.title.text) {
                return insight.simpleInsight.title.text;
            }
        }
        return '';
    }

    constructor(jsonData, apiRef) {
        this.#APIRef = apiRef;
        this.name = jsonData.title ? jsonData.title.text : '';
        this.entityNameJoined = jsonData.navigationUrl?.split("/in/")[1]?.split("?")[0];
        this.profileUrl = jsonData.navigationUrl || '';
        this.trackingUrn = jsonData.trackingUrn || '';

        const match = jsonData.entityUrn?.match(/urn:li:fsd_profile:(.*?),/);
        this.entityUrn = match ? match[1] : '';

        this.jobServices = jsonData.insightsResolutionResults ? this.parseServices(jsonData.insightsResolutionResults) : '';
        this.primarySubtitle = jsonData.primarySubtitle ? jsonData.primarySubtitle.text : '';
        this.secondarySubtitle = jsonData.secondarySubtitle ? jsonData.secondarySubtitle.text : '';
        this.bserpEntityNavigationalUrl = jsonData.bserpEntityNavigationalUrl || '';
    }
}
