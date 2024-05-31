# linkedin-api
An actually useful LinkedIn Nodejs package.

## Disclaimers
This package is not in any way affiliated with LinkedIn. In fact, your account may be banned for using this (hasn't happened to me though).

You can use your LinkedIn credentials in code, making this super simple to use!

*This project was HEAVILY inspired by Tomquirk's LinkedIn-API PyPi package, which you can find at https://github.com/tomquirk/linkedin-api*

## Installation
`npm i linkedin-api-js`


## Quick-Start
```JS
// log in
const LAPI = new linkedInAPIClass();
await LAPI.login("pinknodders@pinknodders.lol", "**********");

// GET a company
const comp = await LAPI.searchCompanies("Linux");

// GET one employee
const emp = await comp[0].getEmployees("Torvalds", 1);
```

## Contributions
If you want to contribute, just fork, add your features, then make a PR

If you do contribute, please follow these guidelines
1. Document your changes in the PR (i.e. make a bulleted list of changes)
2. If you change existing code, you must specify that
3. Please please please don't be me and push credentials

## Reporting Bugs
Please open an issue using the following guildelines
1. Be clear and concise
2. Provide the code necessary to reproduce the problem

Thanks for using my project!
ION606