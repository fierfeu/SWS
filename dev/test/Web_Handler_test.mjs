'use strict'

import { expect } from 'chai';
//const chaiAsPromised = require('chai-as-promised');
import sinon from 'sinon';
//const sandbox = require('sinon').createSandbox;
import Handler, {serverConf} from '../../src/webHandler.mjs';
import urlSiteValidator from'../../src/urlSiteValidator.mjs';
import targetDefinition from '../../src/targetDefinition.mjs';
import pageRender from'../../src/pageRender.mjs';
import res from './responseFake.mjs';
import {EventEmitter} from 'node:events';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

let tmpDir;
let fixturePath;

// Helper pour créer une requête POST simulée
function createPostRequest(url, chunks, headers = {}) {
    /* structure du post par action
    action=addMainPage
      |- filePathName=path/to/file containing the routes definition for the PWA
      |- singletonName=uri to mjs containing the game singleton manager associated to routes file able to manage game adding
      |- webRootPathName=WebRoot for PWA (optional, default is /)
    action=addPackage
      |- filePathName=Package Name
      |- singletonName=uri to svg image as icone
      |- = file path to game routes
      |- = filepath to game prototype mjs
    action=addUser
      |- Not yet implemented
    */
    const req = new EventEmitter();
    req.method = 'POST';
    req.url = url;
    req.headers = headers;
    req.socket = { remoteAddress: '127.0.0.1' };
    // Méthode pour émettre les données une fois que Handler a posé ses écouteurs
    req.send = () => {
        const list = Array.isArray(chunks) ? chunks : [chunks];
        for (const chunk of list) {
            req.emit('data', Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
        }
        req.emit('end');
        req.emit('close'); // Compatibilité avec le code actuel qui écoute 'close'
    };
    return req;
}

describe ("A : WebHandler manages ERROR when a method is not allowed", () => {
    it("must manage PUT as 405 Method is not allowed", () => {
        let response = new res();
        const request = {
            url : '/',
            method : 'PUT'
        };  

        Handler(request,response);

        expect(response.statusCode).to.equal(405);
    });

    it("must manage DELETE as 405 Method is not allowed", () => {
        let response = new res();
        const request = {
            url : '/',
            method : 'DELETE'
        };  

        Handler(request,response);

        expect(response.statusCode).to.equal(405);
    });

    it("must manage PATCH as 405 Method is not allowed", () => {
        let response = new res();
        const request = {
            url : '/',
            method : 'PATCH'
        };  

        Handler(request,response);

        expect(response.statusCode).to.equal(405);
    });

    it("must manage HEAD as 405 Method is not allowed", () => {
        let response = new res();
        const request = {
            url : '/',
            method : 'HEAD'
        };  

        Handler(request,response);

        expect(response.statusCode).to.equal(405);
    });

    it("must manage OPTIONS as 405 Method is not allowed", () => {
        let response = new res();
        const request = {
            url : '/',
            method : 'OPTIONS'
        };  

        Handler(request,response);

        expect(response.statusCode).to.equal(405);
    });

    it("must manage TRACE as 405 Method is not allowed", () => {
        let response = new res();
        const request = {
            url : '/',
            method : 'TRACE'
        };  

        Handler(request,response);

        expect(response.statusCode).to.equal(405);
    });

    it("must manage QUERY as 405 Method is not allowed", () => {
        let response = new res();
        const request = {
            url : '/',
            method : 'QUERY'
        };  

        Handler(request,response);

        expect(response.statusCode).to.equal(405);
    });
});

describe ("B : Tests pour la method POST", () => {
    beforeEach ( () => {
        sinon.restore();
    });

    describe ('1 : Reject not allowed actions in post', () => {  
        it("manage unrecognized action as 406", () => {
            let response = new res();
            const request = createPostRequest('/', "action=unknownAction", {'Content-Type': 'application/json'});
            
            Handler(request, response);
            request.send(); // to emit close event and trigger the processing of the request

            expect(response.statusCode).to.equal(406);
        });

        /*@todo
        it("log an alert message in log if not allowed action recieved throught POST", () => {
            let response = new res();
            const request = createPostRequest('/', JSON.stringify({action: 'unknownAction'}), {'Content-Type': 'application/json'});

        });*/

        it("must assemble multi-chunk POST payloads without data loss", async () => {
            const response = new res();
            // Simulation d'une arrivée en 3 paquets réseau distincts
            const chunks = ['action=add', 'MainPage&file', 'PathName=nonexistent_test.json'];
            const request = createPostRequest('/admin', chunks);

            Handler(request, response);
            request.send();

            await response.finished; // Wait for the response to finish
            
            expect(response.statusCode).to.equal(400);
            expect(response.body).to.include('bad route file path');
        });
    });

    describe ('2 : Manage action=addMainPage', () => {
        before(() => {
                const PATHTO = import.meta.dirname
                // Création d'un environnement de fixtures isolé dans le dossier temporaire du système
                tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sws-webhandler-test-'));
                // Assure que fixturePath possède un séparateur de fin pour les tests de concaténation
                 fixturePath = tmpDir.endsWith(path.sep) ? tmpDir : tmpDir + path.sep;

                // 1. Fichiers routes valides
                    fs.writeFileSync(path.join(tmpDir, 'emptyRoute.json'), '{}', 'utf8');
                    fs.writeFileSync(path.join(tmpDir, 'validRoute.json'), '{"/Game.mjs": "/../dev/test/Game.mjs"}', 'utf8');
                    fs.writeFileSync(path.join(tmpDir, 'validRouteBad.json'), '{"/GameBad.mjs": "/../dev/test/GameBad.mjs"}', 'utf8');  
                    fs.writeFileSync(path.join(tmpDir, 'validRouteGood.json'), '{"/GameGood.mjs": "/../dev/test/GameGood.mjs","/": "./test.html"}', 'utf8');  

        });

        after(() => {
            // Nettoyage des fichiers de test après l'exécution des tests
            fs.rmSync(tmpDir, { recursive: true, force: true });
        });

        it("manage unrecognized filePathName for routes as 400", async () => {
            let response = new res();
            const request = createPostRequest('/', "action=addMainPage&filePathName=nonExistentFile.json", {'Content-Type': 'application/json'});
            
            Handler(request, response);
            request.send(); // to emit close event and trigger the processing of the request

            await response.finished; // Wait for the response to finish

            expect(response.statusCode).to.equal(400);
        });

       it("manage recognized filePathName but empty content as 400", async () => {
            let response = new res();
            const request = createPostRequest('/', `action=addMainPage&filePathName=${fixturePath}emptyRoute.json`, {'Content-Type': 'application/json'});
            
            Handler(request, response);
            request.send(); // to emit close event and trigger the processing of the request

            await response.finished; // Wait for the response to finish

            expect(response.statusCode).to.equal(400);
            expect(response.body).to.include('bad route file content : empty');
        });

       it ("manage empty singletonName", async () => {
            let response = new res();
            const request = createPostRequest('/', `action=addMainPage&filePathName=${fixturePath}validRoute.json`, {'Content-Type': 'application/json'});
            
            Handler(request, response);
            request.send(); // to emit close event and trigger the processing of the request

            await response.finished; // Wait for the response to finish

            expect(response.statusCode).to.equal(400);
            expect(response.body).to.include('bad singleton name : empty');
        });

        it("manage unrecognized singletonName as 400 and not routable", async () => {
            let response = new res();
            const request = createPostRequest('/', `action=addMainPage&filePathName=${fixturePath}validRoute.json&singletonName=/nonExistentSingleton.js`, {'Content-Type': 'application/json'});
            
            Handler(request, response);
            request.send(); // to emit close event and trigger the processing of the request

            await response.finished; // Wait for the response to finish

            expect(response.statusCode).to.equal(400);
            expect(response.body).to.include('singleton not routable');
        });

        it("manage good singletonName but game.mjs not create and no server error", async () => {
            let response = new res();
            const request = createPostRequest('/', `action=addMainPage&filePathName=${fixturePath}validRoute.json&singletonName=/Game.mjs`, {'Content-Type': 'application/json'});
            
            Handler(request, response);
            request.send(); // to emit close event and trigger the processing of the request

            await response.finished; // Wait for the response to finish

            expect(response.statusCode).to.equal(400);
            expect(response.body).to.include('bad singleton name or not reachable on server side');
        });

        it("manage good singletonName and create game.mjs with empty content ", async () => {
            const PATHTO = import.meta.dirname
            let response = new res();
            const request = createPostRequest('/', `action=addMainPage&filePathName=${fixturePath}validRouteBad.json&singletonName=/GameBad.mjs`, {'Content-Type': 'application/json'});
            fs.writeFileSync(path.join(PATHTO, '/GameBad.mjs'), 'export default class Game{}', 'utf8');

            Handler(request, response);
            request.send(); // to emit close event and trigger the processing of the request

            await response.finished; // Wait for the response to finish

            expect(response.statusCode).to.equal(400);
            expect(response.body).to.include('bad class prototype : no addPackage function available');
            // Nettoyage du fichier Game.mjs après le test
            fs.rmSync(path.join(PATHTO, '/GameBad.mjs'),{ force: true });  
        });

        it("manage good singletonName and create game.mjs with addPackage function but empty webRootPathName", async () => {
            const PATHTO = import.meta.dirname
            let response = new res();
            const request = createPostRequest('/', `action=addMainPage&filePathName=${fixturePath}validRouteGood.json&singletonName=/GameGood.mjs`, {'Content-Type': 'application/json'});
            fs.writeFileSync(path.join(PATHTO, '/GameGood.mjs'), 'export default class Game{ addPackage() {} }', 'utf8');

            Handler(request, response);
            request.send(); // to emit close event and trigger the processing of the request

            await response.finished; // Wait for the response to finish

            expect(response.statusCode).to.equal(400);
            expect(response.body).to.include('bad webRootPathName : empty');
            // Nettoyage du fichier Game.mjs après le test
            fs.rmSync(path.join(PATHTO, '/GameGood.mjs'),{ force: true });  
        });

        it("manage good singletonName and create game.mjs with addPackage function and good webRootPathName", async () => {
            const PATHTO = import.meta.dirname
            let response = new res();
            const request = createPostRequest('/', `action=addMainPage&filePathName=${fixturePath}validRouteGood.json&singletonName=/GameGood.mjs&webRootPathName=/`, {'Content-Type': 'application/json'});
            fs.writeFileSync(path.join(PATHTO, '/GameGood.mjs'), 'export default class Game{ addPackage() {} }', 'utf8');
            fs.writeFileSync(path.join(PATHTO, '/../../src/test.html'), '<html><body><h1>Test oK Page</h1></body></html>', 'utf8');

            Handler(request, response);
            request.send(); // to emit close event and trigger the processing of the request

            await response.finished; // Wait for the response to finish

            expect(response.statusCode).to.equal(200);
            expect(response.body).to.include('Test oK Page');
            expect(serverConf.pageLoaded).to.be.true;
            expect(serverConf.pageDescriptor.singletonName).to.deep.equal('/GameGood.mjs');
            // Nettoyage du fichier Game.mjs après le test
            fs.rmSync(path.join(PATHTO, '/GameGood.mjs'),{ force: true });  
            fs.rmSync(path.join(PATHTO, '/../../src/test.html'),{ force: true });
        });
    });

    describe ('3 : Manage action=addAPackage', () => {
        /*
        Post action = addApackage
        {
            "action":"addAPackage",
            "packageName":"myPackage",
            "imgFilePathName":"/path/to/icon.svg",
            "filePathName":"/path/to/game_routes.json",
            "packageClassName":"/path/to/prototype.mjs"
        }
        Need to addMainPage before to addAPackage -> serverConf.pageDescriptor valid and routesPagesConf valid
        */
       it("is not possible to addPAckage if no pageDescriptor is set in serverConf", async () => {
            delete serverConf.pageDescriptor; // Ensure pageDescriptor is not set  
            serverConf.pageLoaded = false;
            serverConf.packagesLoaded = 0;
            serverConf.usersDefined = 0;
            let response = new res();
            const request = createPostRequest('/', `action=addAPackage&packageName=myPackage&imgFilePathName=/path/to/icon.svg&filePathName=/path/to/game_routes.json&packageClassName=/path/to/prototype.mjs`, {'Content-Type': 'application/json'});
            
            Handler(request, response);
            request.send(); // to emit close event and trigger the processing of the request

            await response.finished; // Wait for the response to finish

            expect(response.statusCode).to.equal(400);
            console.log(response.body)
            expect(response.body).to.include('You must define a PWA application first');
       });
    });
});

describe ("C : Tests pour la method GET", () => {
    describe ('1 :webhandler used urlSiteValidator', () => {
    
        //On passe obligatoirement par la fct de validation pour ttes les requètes
        it("must used urlSiteValidator.validate for any call to webHandler", () =>{
            let response = new res();
            
            sinon.spy(urlSiteValidator,'validate');
            let request = {
                url :'myUrl',
                socket : {
                    remoteAdress : '125.125.125.125'
                },
                method : 'GET'
            };
            
            Handler(request,response);
            
            expect(urlSiteValidator.validate.calledOnceWith('myUrl')).to.be.true;
            urlSiteValidator.validate.restore();

        });
    });

    
    describe ('2 :webhandler used targetDefinition',()=>{
        // On passe obligatoirement par la définition de la page et du fichier de rendu associé
        it("must used target definition if code 200",()=>{
            let response = new res();

            sinon.spy(targetDefinition,'resolved');
            const request ={
                url : '/',
                method : 'GET'
            };

            Handler(request,response);

            expect(targetDefinition.resolved.calledOnceWith('/')).to.be.true;

            targetDefinition.resolved.restore();
        });

        it("targetDefinition not called if return code is not 200", ()=>{
            let response = new res();

            sinon.spy(targetDefinition,'resolved');
            
            const request = {
                url : 'badUrl',
                method : 'GET'
            };

            Handler(request,response);

            expect(targetDefinition.resolved.calledOnceWith('badUrl/')).to.be.false;

            targetDefinition.resolved.restore();
        });

    });

        // TODO la fonction d'identification de la target est la seconde fonction
    describe ("3 :targetDefinition must be called after url validation", ()=>{
        it("verification test", ()=>{
            let response = new res();

            sinon.spy(targetDefinition,'resolved');
            sinon.spy(urlSiteValidator,'validate');

            const request = {
                url : '/',
                method : 'GET'
            };

            Handler(request,response);

            expect(targetDefinition.resolved.calledAfter(urlSiteValidator.validate)).to.be.true;

            targetDefinition.resolved.restore();
            urlSiteValidator.validate.restore();
        });
    });

        // TODO On passe par la vérification des droits d'accès obligatoirement

        // TODO la fonction de verification des droits est la troisème fonction

        // TODO On passe par l'application du contexte à la page

        // TODO l'application du contexte est obligatoirement en quatrième position

    describe (" 4 :Webhandler must go through page rendering function",()=>{
        beforeEach ( () => {
            sinon.spy(pageRender,'render');
        });

        afterEach ( ()=>{
            pageRender.render.restore();
        });
        it("must used pageRender function with good url",()=>{
            let response = new res();
            const request = {
                url : '/',
                method : 'GET'
            };

            Handler(request,response);

            expect(pageRender.render.calledOnce).to.be.true;
        });
        it("must used pageRender function with bad url",()=>{
            let response = new res();
            const request = {
                url : 'badUrl',
                method : 'GET'
            };

            Handler(request,response);

            expect(pageRender.render.calledOnce).to.be.true;
        });  
    });

        // TODO le rendu est obligatoirment la dernière fonction    
    describe ('5 :pageRender is the latest function of web handler', () => {
        beforeEach ( () => {
            sinon.spy(pageRender,'render');
        });

        afterEach ( ()=>{
            pageRender.render.restore();
        });
        // TODO if good url pageRender.render must be run after targetDefinition.resolved
        it ('if good url pageRender.render must be run after targetDefinition.resolved',()=>{
            sinon.spy(targetDefinition,'resolved');
            let response = new res();
            const request = {
                url : '/',
                method : 'GET'
            };

            Handler(request,response);

            expect(pageRender.render.calledAfter(targetDefinition.resolved)).to.be.true;

            targetDefinition.resolved.restore();
        });
        // TODO if bad url pageRender.render must be run after urlSiteValidator.validate
        it('if bad url pageRender.render must be run after urlSiteValidator.validate',()=>{
            sinon.spy(urlSiteValidator,'validate');

            let response = new res();
            const request = {
                url : 'badUrl',
                method : 'GET'
            };

            Handler(request,response);

            expect(pageRender.render.calledAfter(urlSiteValidator.validate)).to.be.true;

            urlSiteValidator.validate.restore();
        });
    });
});

