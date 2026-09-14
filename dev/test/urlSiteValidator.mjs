'use strict'

import {expect} from 'chai'
import urlSiteValidator from'../../src/urlSiteValidator.mjs';



describe("urlSiteValidator is working as expected", ()=>{
    // si l'url est vide, malformatée ou pas dans la liste des pages du domaine alors la focntion retourne le code 404
    it("should return 404 if url is empty", (done)=>{
        let url = '';

        expect(urlSiteValidator.validate(url)).to.be .equal(404);
        
        done();
    });

    it("should return 404 for dab formated url", (done) =>{
        let url ='badUrl';

        expect(urlSiteValidator.validate(url)).to.be .equal(404);
        
        done();
    });

    it("should return 404 for url not listed in site configuration", (done) => {
        let url ='/notListedUrl';
        let sitePagesConf = {
            '/' : 'index.html'
        };

        expect(urlSiteValidator.validate(url,sitePagesConf)).to.be .equal(404);
        
        done();
    });
});

describe ("urlSiteValidator returns 200 for good url", () =>{
    // Pour chaque url dans la liste des pages la fonction retourne un code 200
    
    let sitePagesConf = {
        '/' : 'index.html',
        '/index.html' : 'index.html'
    };

    it ("should return 200 for '/' access", ()=>{
        let url ='/';

        expect(urlSiteValidator.validate(url,sitePagesConf)).to.be.equal(200);
    });

    it("should return 200 for '/index.html' access", () => {
        let url ='/index.html';

        expect(urlSiteValidator.validate(url,sitePagesConf)).to.be.equal(200);
    });
    
    // il n'y a jamais de hash dans req.url donc ce n'est pas gérer pour le momment.

    // La présence d'une query ne modifie pas le comportement de la fonction
    it("hash tag don't change return code value",()=>{
        const url="/?foo=bar";

        expect(urlSiteValidator.validate(url,sitePagesConf)).to.be.equal(200);
    });
});