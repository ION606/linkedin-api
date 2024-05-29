
export class LinkedInProfile {
    private APIRef: linkedInAPIClass;

    /**
     * Constructor to create a LinkedInProfile instance.
     * @param jsonData Data used to initialize the profile properties.
     * @param apiRef Reference to an instance of linkedInAPIClass used for API calls.
     */
    constructor(jsonData: {
        title?: { text: string },
        navigationUrl?: string,
        trackingUrn?: string,
        entityUrn?: string,
        insightsResolutionResults?: Array<{ simpleInsight?: { title?: { text: string } } }>
        primarySubtitle?: { text: string },
        secondarySubtitle?: { text: string },
        bserpEntityNavigationalUrl?: string,
    }, apiRef: linkedInAPIClass);

    /**
     * Retrieves the contact information for the LinkedIn profile.
     * @returns A Promise that resolves to an object containing various contact information.
     */
    getContactInfo(): Promise<{
        websites: Array<{ label: string, category: string, url: string }>,
        emailAddress: string,
        phoneNumbers: string[],
        weChatContactInfo: any,
        twitterHandles: string[],
        instantMessengers: any[]
    }>;

    /**
     * Parses the services offered by the profile from insights data.
     * @param insights Array containing insights data.
     * @returns A string describing the services if found, otherwise an empty string.
     */
    parseServices(insights: Array<{
        simpleInsight?: {
            title?: { text: string }
        }
    }>): string;

    // Public properties inferred from constructor
    name: string;
    entityNameJoined: string;
    profileUrl: string;
    trackingUrn: string;
    entityUrn: string;
    jobServices: string;
    primarySubtitle: string;
    secondarySubtitle: string;
    bserpEntityNavigationalUrl: string;
}


export class Company {
    private APIRef: linkedInAPIClass;

    /**
     * Constructor to create a Company instance.
     * @param data Data used to initialize the company properties.
     * @param APIRef Reference to an instance of linkedInAPIClass used for API calls.
     */
    constructor(data: {
        title: { text: string },
        entityUrn: string,
        navigationUrl: string
    }, APIRef: linkedInAPIClass);

    /**
     * Retrieves the employees of a company, either as LinkedInProfile instances or raw JSON.
     * @param limit The maximum number of employee profiles to retrieve, ceiled to the nearest multiple of 50.
     * @param raw Whether to return raw JSON data instead of LinkedInProfile instances.
     * @returns A Promise resolving to an array of LinkedInProfile instances or raw JSON, depending on the raw parameter.
     */
    getEmployees(limit?: number, raw?: boolean): Promise<LinkedInProfile[] | any[]>;

    /**
     * Retrieves information about the company.
     * @returns A Promise resolving to the company information as JSON.
     */
    getInfo(): Promise<any>;

    /**
     * Checks if the necessary properties for a complete company profile have been set.
     * @returns true if all required properties are present, false otherwise.
     */
    checkIfCompleted(): boolean;

    // Public properties inferred from constructor
    name: string;
    urn: string;
    url: string;
}


// misc

/**
 * Class representing a type of reaction and its count.
 */
export class ReactionTypeCount {
    constructor(params: { count: number; reactionType: string; });

    count: number;
    reactionType: string;
}

/**
 * Class representing the counts of social activities such as likes and comments.
 */
export class SocialActivityCounts {
    constructor(params: {
        entityUrn: string;
        numComments: number;
        numLikes: number;
        reactionTypeCounts: Array<{ count: number; reactionType: string; }>;
        liked: boolean;
        preDashEntityUrn?: string;
    });

    entityUrn: string;
    numComments: number;
    numLikes: number;
    reactionTypeCounts: ReactionTypeCount[];
    liked: boolean;
    preDashEntityUrn?: string;
}

/**
 * Class representing a group with a unique entity URN.
 */
export class Group {
    constructor(params: { entityUrn: string; });

    entityUrn: string;
}

/**
 * A generic class that assigns passed data to its instance.
 */
export class GenericEntity {
    constructor(data: any);

    [key: string]: any;
}


export default class linkedInAPIClass {
    constructor(resetCookies?: boolean);

    /**
     * A function to try and trick the LinkedIn API rate limit/bot detector
     */
    evade(): Promise<void>;

    /**
     * Searches for companies on LinkedIn.
     * @param keyword Keyword for searching, e.g., "biotechnology"
     * @param numEmp Array of numbers representing company sizes
     * @param start Pagination start
     * @param castToClass Whether to cast the result to Company classes or return raw JSON
     * @param excludeGeneric Whether to exclude the "generic" class
     * @returns Promise resolving to either an array of SocialActivityCounts or Group or Company or GenericEntity
     */
    searchCompanies(keyword: string, numEmp?: number[], start?: number, castToClass?: boolean, excludeGeneric?: boolean): Promise<[SocialActivityCounts | Group | Company | GenericEntity]>;

    /**
     * Searches for LinkedIn employees.
     * @param keyword The user to search for
     * @param limit Maximum number of results
     * @param castToClass Whether to cast the result to LinkedInProfile classes or return raw JSON
     * @param filterObfuscated where or not to filter out members with obfuscated profiles ("LinkedIn Member")
     * @param currentCompanies Companies to filter by
     * @param conDeg Connection degrees to include
     * @returns Promise resolving to either an array of LinkedInProfile or raw JSON
     */
    searchEmployees(keyword: string, limit?: number, castToClass?: boolean, filterObfuscated?: boolean, currentCompanies?: string[], conDeg?: Array<1 | 2 | 3>): Promise<any>;

    /**
     * Makes a request to the LinkedIn API.
     * @param reqPath The API endpoint path
     * @param isProfile Whether the request is for a profile
     * @returns Promise resolving to the API response
     */
    private _makeReq(reqPath: string, isProfile?: boolean): Promise<any>;

    /**
     * Logs into LinkedIn using either cookies or authentication.
     * @param username LinkedIn username
     * @param password LinkedIn password
     * @throws Throws an error if login fails
     */
    login(username: string, password: string): Promise<void>;

    private headers: any;
    private resetCookies: boolean;
    private helper: any;
}

/**
 * Finds the range index for a given number.
 * 
 * @param number The number to find the range index for.
 * @returns The corresponding range index as a string.
 */
export function findRangeIndex(number: number): string | -1;

/**
 * Converts an array of numbers to a comma-separated string of range indices.
 * 
 * @param nums An array of numbers to convert to range indices.
 * @returns A comma-separated string of range indices.
 * @throws An error if more than 8 numbers are provided or if any number is invalid.
 */
export function numsToSizes(...nums: number[]): string;