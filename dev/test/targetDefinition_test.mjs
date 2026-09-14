'uses strict'

import {expect} from 'chai'
import targetDefinition from '../../src/targetDefinition.mjs';

describe("targetDefinition is working well",()=>{
    // targetDefinition return the good target for a given request.url
    it("targetDefinition returns the good target for a given url", ()=>{
        const sitePagesConf = {
            '/' : 'index.html'
        };
        
        const url = '/';
        
        expect(targetDefinition.resolved(url,sitePagesConf)).to.be.equal('index.html');
    });

    // query don't change the target
    it("targetDefinition still return the good target even if there's a query",()=>{
        const sitePagesConf = {
            '/' : 'index.html'
        };
        
        const url = '/?foo=bar';
        
        expect(targetDefinition.resolved(url,sitePagesConf)).to.be.equal('index.html');
    });

    // hash don't change the target
    it("targetDefinition still return the good target even if there's a hash in url",()=>{
        const sitePagesConf = {
            '/' : 'index.html'
        };
        
        const url = '/#foo';
        
        expect(targetDefinition.resolved(url,sitePagesConf)).to.be.equal('index.html');
    });
});
