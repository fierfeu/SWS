'use strict'

import {expect} from 'chai'
import urlSiteValidator from'../../src/urlSiteValidator.mjs';

const sitePagesConf = {
    '/' : 'index.html',
    '/index.html' : 'index.html',
    '/admin' : 'admin.html'
};

describe("urlSiteValidator is working as expected", ()=>{
    // si l'url est malformatée ou pas dans la liste des pages du domaine alors la focntion retourne le code 404
    it("should return 404 if no route list is provided", () =>{
        const url ='nevermindurl';
        expect(urlSiteValidator.validate(url)).to.be.equal(404)
    });


    it("should return 404 if url is not a valid url", ()=>{
        expect(urlSiteValidator.validate('http://[::1]:::', sitePagesConf)).to.equal(404);
        expect(urlSiteValidator.validate('https://example.com:abc', sitePagesConf)).to.equal(404);
    });
        
    it("should return 404 for url not listed in site configuration", () => {
        const url ='/notListedUrl';

        expect(urlSiteValidator.validate(url,sitePagesConf)).to.be.equal(404);
        
    });

    it('should return 404 when case does not match', () => {
            expect(urlSiteValidator.validate('/INDEX.HTML', sitePagesConf)).to.equal(404);
    });

    it('should return 404 for trailing slash mismatch (e.g. /admin/)', () => {
        expect(urlSiteValidator.validate('/admin/', sitePagesConf)).to.equal(404);
    });

    // empty urlis considered as a request to the root of the site, so it should return 200
    it("should return 200 if url is empty", ()=>{
        const url = '';

        expect(urlSiteValidator.validate(url,sitePagesConf)).to.be.equal(200);
        
    });
});

describe('resilience to unexpected inputs', () => {
    it('should return 404 and not crash on invalid or null URL values', () => {
        expect(urlSiteValidator.validate(null, sitePagesConf)).to.equal(404);
        expect(urlSiteValidator.validate(undefined, sitePagesConf)).to.equal(404);
    });
    
    it("should return 404 for absolute URLs with external origins/hosts", () => {
        expect(urlSiteValidator.validate('https://evil.com/index.html', sitePagesConf)).to.equal(404);
        expect(urlSiteValidator.validate('http://other-domain.com/', sitePagesConf)).to.equal(404);
    });


});

describe ("urlSiteValidator returns 200 for good url", () =>{
    // Pour chaque url dans la liste des pages la fonction retourne un code 200
    
    it ("should return 200 for '/' access", ()=>{
        expect(urlSiteValidator.validate("/",sitePagesConf)).to.be.equal(200);
    });

    it("should return 200 for '/index.html' access", () => {
        const url ='/index.html';

        expect(urlSiteValidator.validate(url,sitePagesConf)).to.be.equal(200);
    });
    
    // defensive programming : hashes in the url should not change the return code value
    it("hash don't change return code value",()=>{
        const url="/#foo";

        expect(urlSiteValidator.validate(url,sitePagesConf)).to.be.equal(200);
    });

    // La présence d'une query ne modifie pas le comportement de la fonction
    it("query string don't change return code value",()=>{
        const url="/?foo=bar";

        expect(urlSiteValidator.validate(url,sitePagesConf)).to.be.equal(200);
    });
});