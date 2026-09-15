'use strict'

import {expect} from 'chai'
import targetDefinition from '../../src/targetDefinition.mjs';

describe("targetDefinition is working well",()=>{
    const sitePagesConf = {
        '/' : '/../web/html/index.html',
        '/index.html' : '/../web/html/index.html',
        '/admin.html' : '/../web/html/admin.html'
    };

    // targetDefinition return the good target for a given request.url
    it("returns the good target for a given url", ()=>{
        const url = '/';
        
        expect(targetDefinition.resolved(url,sitePagesConf)).to.be.equal('/../web/html/index.html');
    });

    // query don't change the target
    it("still returns the good target even if there's a query",()=>{      
        const url = '/index.html?foo=bar';
        
        expect(targetDefinition.resolved(url,sitePagesConf)).to.be.equal('/../web/html/index.html');
    });

    // hash don't change the target
    it("still returns the good target even if there's a hash in url",()=>{        
        const url = '/admin.html#foo';
        
        expect(targetDefinition.resolved(url,sitePagesConf)).to.be.equal('/../web/html/admin.html');
    });

    it("should resolve normalized paths with dot segments", () => {
     expect(targetDefinition.resolved('/admin/../index.html', sitePagesConf)).to.equal('/../web/html/index.html');
    });

    //returns undefined if the url is not in the sitePagesConf or not valid
    it("returns undefined if the url is not in the sitePagesConf or not valid",()=>{
        const url = '/notfound.html';
        
        expect(targetDefinition.resolved(url,sitePagesConf)).to.be.undefined;
        expect(targetDefinition.resolved(undefined,sitePagesConf)).to.be.undefined;
    });
});
