'use strict';

import { expect } from 'chai';
import sinon from 'sinon';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import pageRender from '../../src/pageRender.mjs';
import ResponseFake from './responseFake.mjs';

describe('[pageRender] Suite de tests robuste pour serveur HTTPS (PWA & Admin)', () => {
    let tmpDir;
    let fixturePath;

    before(() => {
        // Création d'un environnement de fixtures isolé dans le dossier temporaire du système
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sws-pagerender-test-'));
        // Assure que fixturePath possède un séparateur de fin pour les tests de concaténation
        fixturePath = tmpDir.endsWith(path.sep) ? tmpDir : tmpDir + path.sep;

        // 1. Fichiers texte
        fs.writeFileSync(path.join(tmpDir, 'index.html'), '<!DOCTYPE html><html><body>Admin & PWA</body></html>', 'utf8');
        fs.writeFileSync(path.join(tmpDir, 'styles.css'), 'body { margin: 0; background: #fff; }', 'utf8');
        fs.writeFileSync(path.join(tmpDir, 'app.js'), 'console.log("PWA Loaded");', 'utf8');
        fs.writeFileSync(path.join(tmpDir, 'module.mjs'), 'export const ready = true;', 'utf8');
        fs.writeFileSync(path.join(tmpDir, 'data.json'), '{"service": "admin", "active": true}', 'utf8');
        fs.writeFileSync(path.join(tmpDir, 'notes.txt'), 'Plain text content', 'utf8');

        // 2. Fichiers PWA spécifiques (manifeste, service worker)
        fs.writeFileSync(path.join(tmpDir, 'manifest.webmanifest'), '{"name": "VVSGC PWA", "short_name": "VVSGC"}', 'utf8');
        fs.writeFileSync(path.join(tmpDir, 'manifest.json'), '{"name": "VVSGC PWA"}', 'utf8');
        fs.writeFileSync(path.join(tmpDir, 'sw.js'), 'self.addEventListener("fetch", () => {});', 'utf8');

        // 3. Fichiers binaires (images, icônes, polices) avec octets réels
        const binary16Bytes = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x01, 0x02, 0x03, 0xFE, 0xFF, 0xAA, 0x55]);
        fs.writeFileSync(path.join(tmpDir, 'icon.png'), binary16Bytes);
        fs.writeFileSync(path.join(tmpDir, 'photo.jpg'), binary16Bytes);
        fs.writeFileSync(path.join(tmpDir, 'photo.jpeg'), binary16Bytes);
        fs.writeFileSync(path.join(tmpDir, 'favicon.ico'), binary16Bytes);
        fs.writeFileSync(path.join(tmpDir, 'anim.gif'), binary16Bytes);
        fs.writeFileSync(path.join(tmpDir, 'image.webp'), binary16Bytes);
        fs.writeFileSync(path.join(tmpDir, 'font.ttf'), binary16Bytes);
        fs.writeFileSync(path.join(tmpDir, 'font.woff2'), binary16Bytes);
        fs.writeFileSync(path.join(tmpDir, 'logo.svg'), '<svg xmlns="http://www.w3.org/2000/svg"></svg>', 'utf8');

        // 4. Fichier sensible situé en dehors de la racine web autorisée
        fs.writeFileSync(path.join(tmpDir, 'secret_admin_key.pem'), 'CONFIDENTIAL_KEY_NOT_FOR_WEB', 'utf8');
    });

    after(() => {
        // Nettoyage complet de l'arborescence temporaire
        if (tmpDir && fs.existsSync(tmpDir)) {
            fs.rmSync(tmpDir, { recursive: true, force: true });
        }
    });

    afterEach(() => {
        sinon.restore();
    });

    // =========================================================================
    // 1. CYCLE DE VIE HTTP & TERMINAISON DU FLUX (CRITIQUE POUR SERVEUR HTTPS)
    // =========================================================================
    describe('1. Cycle de vie de la réponse HTTP et robustesse', () => {
        it('doit impérativement terminer la réponse avec res.end() pour ne pas figer la connexion HTTPS', () => {
            const response = new ResponseFake();
            sinon.spy(response, 'end');

            pageRender.render(response, 'index.html', 200, fixturePath);

            expect(response.end.calledOnce, "res.end() doit être appelé exactement une fois").to.be.true;
            expect(response.ended).to.be.true;
        });

        it('doit appeler writeHead, write et end dans le bon ordre protocolaire', () => {
            const response = new ResponseFake();
            const writeHeadSpy = sinon.spy(response, 'writeHead');
            const writeSpy = sinon.spy(response, 'write');
            const endSpy = sinon.spy(response, 'end');

            pageRender.render(response, 'index.html', 200, fixturePath);

            expect(writeHeadSpy.calledBefore(writeSpy), "writeHead doit précéder write").to.be.true;
            expect(writeSpy.calledBefore(endSpy), "write doit précéder end").to.be.true;
        });

        it('doit propager fidèlement le code HTTP passé en paramètre (ex: 200, 304 Not Modified)', () => {
            const response = new ResponseFake();
            pageRender.render(response, 'index.html', 304, fixturePath);

            expect(response.statusCode).to.equal(304);
        });

        it('ne doit pas crasher le processus serveur si les arguments obligatoires sont manquants (anti-DoS)', () => {
            const response = new ResponseFake();
            // Si une exception non capturée est levée, le serveur HTTPS entier s'arrête brutalement
            expect(() => {
                pageRender.render(response, null, 200, fixturePath);
            }).to.not.throw();
            expect(response.statusCode).to.be.oneOf([400, 404, 500]);
        });
    });

    // =========================================================================
    // 2. EXIGENCES PROGRESSIVE WEB APP (PWA) & TYPES MIME
    // =========================================================================
    describe('2. Prise en charge des exigences PWA (manifest, service worker, formats modernes)', () => {
        it('doit servir le manifeste PWA (.webmanifest) avec le Content-Type standard "application/manifest+json"', () => {
            const response = new ResponseFake();
            pageRender.render(response, 'manifest.webmanifest', 200, fixturePath);

            expect(response.statusCode).to.equal(200);
            const contentType = response.getHeader('content-type');
            expect(contentType).to.include('application/manifest+json');
        });

        it('doit servir le manifeste standard (.json) avec "application/json" (et non "text/json" obsolète)', () => {
            const response = new ResponseFake();
            pageRender.render(response, 'manifest.json', 200, fixturePath);

            expect(response.statusCode).to.equal(200);
            const contentType = response.getHeader('content-type');
            expect(contentType).to.include('application/json');
        });

        it('doit servir le Service Worker (sw.js) et les modules (.mjs) avec "application/javascript"', () => {
            const swResponse = new ResponseFake();
            pageRender.render(swResponse, 'sw.js', 200, fixturePath);
            expect(swResponse.statusCode).to.equal(200);
            expect(swResponse.getHeader('content-type')).to.include('application/javascript');

            const mjsResponse = new ResponseFake();
            pageRender.render(mjsResponse, 'module.mjs', 200, fixturePath);
            expect(mjsResponse.statusCode).to.equal(200);
            expect(mjsResponse.getHeader('content-type')).to.include('application/javascript');
        });

        it('doit supporter les formats d\'images modernes indispensables en PWA (.webp, .svg, .jpeg)', () => {
            const formats = [
                { file: 'image.webp', mime: 'image/webp' },
                { file: 'logo.svg', mime: 'image/svg+xml' },
                { file: 'photo.jpeg', mime: 'image/jpeg' },
                { file: 'photo.jpg', mime: 'image/jpeg' },
                { file: 'icon.png', mime: 'image/png' },
                { file: 'favicon.ico', mime: 'image/x-icon' }
            ];

            for (const { file, mime } of formats) {
                const res = new ResponseFake();
                pageRender.render(res, file, 200, fixturePath);
                expect(res.statusCode, `Échec pour le fichier ${file}`).to.equal(200);
                expect(res.getHeader('content-type'), `MIME incorrect pour ${file}`).to.equal(mime);
            }
        });

        it('doit supporter les polices web modernes indispensables aux PWA (.woff2, .ttf)', () => {
            const fonts = [
                { file: 'font.woff2', mime: 'font/woff2' },
                { file: 'font.ttf', mime: 'font/ttf' }
            ];

            for (const { file, mime } of fonts) {
                const res = new ResponseFake();
                pageRender.render(res, file, 200, fixturePath);
                expect(res.statusCode, `Échec statut police ${file}`).to.equal(200);
                expect(res.getHeader('content-type'), `MIME police incorrect pour ${file}`).to.equal(mime);
            }
        });

        it('doit gérer le cache-busting par query string (ex: app.js?v=2.1.0) sans altérer le type MIME ni renvoyer 404', () => {
            const response = new ResponseFake();
            // En PWA, les assets statiques sont fréquemment appelés avec ?v=... ou ?h=...
            pageRender.render(response, 'app.js?v=2.1.0', 200, fixturePath);

            expect(response.statusCode, "Le cache-busting avec query string ne doit pas provoquer un 404").to.equal(200);
            expect(response.getHeader('content-type')).to.include('application/javascript');
        });

        it('doit être insensible à la casse des extensions de fichier (ex: index.HTML, icon.PNG)', () => {
            // Création temporaire d'un fichier avec extension en majuscule
            fs.writeFileSync(path.join(tmpDir, 'uppercase.HTML'), '<h1>UPPER</h1>', 'utf8');

            const response = new ResponseFake();
            pageRender.render(response, 'uppercase.HTML', 200, fixturePath);

            expect(response.statusCode).to.equal(200);
            expect(response.getHeader('content-type')).to.include('text/html');
        });
    });

    // =========================================================================
    // 3. SÉCURITÉ HTTPS & INTERFACE D'ADMINISTRATION (PATH TRAVERSAL & FUITES)
    // =========================================================================
    describe('3. Sécurité Admin & HTTPS (Protection contre le Path Traversal)', () => {
        it('doit bloquer toute tentative d\'échappement de répertoire (Path Traversal avec ../) même pour une extension autorisée (.json)', () => {
            const response = new ResponseFake();

            // Création d'un sous-dossier simulant la racine web publique
            const publicWebRoot = path.join(tmpDir, 'public');
            fs.mkdirSync(publicWebRoot, { recursive: true });
            fs.writeFileSync(path.join(publicWebRoot, 'public.html'), '<h1>Public</h1>', 'utf8');

            // Fichier sensible situé en dehors de la racine publique (ex: données admin / credentials)
            fs.writeFileSync(path.join(tmpDir, 'admin_credentials.json'), '{"admin_token": "CRITICAL_SECRET_HASH"}', 'utf8');

            // Tentative d'accès frauduleux au fichier JSON en dehors du web root via ../
            const maliciousRelativePath = '../admin_credentials.json';
            pageRender.render(response, maliciousRelativePath, 200, publicWebRoot + path.sep);

            // Le serveur ne doit sous aucun prétexte servir ce contenu confidentiel !
            if (response.body) {
                expect(response.body.toString(), "Vulnérabilité critique : les données sensibles ne doivent pas fuiter via ../").to.not.include('CRITICAL_SECRET_HASH');
            }
            expect(response.statusCode, "Le Path Traversal doit être rejeté avec 403 ou 404").to.be.oneOf([403, 404]);
        });

        it('doit gérer correctement la concaténation de chemin que pathTo contienne ou non un slash final', () => {
            const pathWithoutSlash = tmpDir.endsWith(path.sep) ? tmpDir.slice(0, -1) : tmpDir;
            const response = new ResponseFake();

            // Appel avec 'index.html' sans slash initial et pathTo sans slash final
            pageRender.render(response, 'index.html', 200, pathWithoutSlash);
            
            expect(response.statusCode).to.equal(200);
            expect(response.body).to.include('Admin & PWA');
        });
    });

    // =========================================================================
    // 4. CONFORMITÉ HTTP & GESTION SÉMANTIQUE DES ERREURS (404 vs 500)
    // =========================================================================
    describe('4. Conformité sémantique des statuts HTTP (404 vs 500)', () => {
        it('doit renvoyer un code 404 (Not Found) et NON 500 lorsqu\'un fichier n\'existe pas', () => {
            const response = new ResponseFake();

            pageRender.render(response, 'fichier_inexistant_xyz.html', 200, fixturePath);

            // Un fichier absent est une erreur client (404), pas une erreur interne du serveur (500)
            expect(response.statusCode, "Un fichier non trouvé doit retourner 404 et non 500").to.equal(404);
        });

        it('doit renvoyer un code 404 ou 415 si l\'extension n\'est pas autorisée', () => {
            const response = new ResponseFake();
            fs.writeFileSync(path.join(tmpDir, 'badfile.unknownext'), 'content', 'utf8');

            pageRender.render(response, 'badfile.unknownext', 200, fixturePath);

            expect(response.statusCode).to.be.oneOf([404, 415]);
        });
    });

    // =========================================================================
    // 5. INTÉGRITÉ DES DONNÉES & GESTION DU CHARSET
    // =========================================================================
    describe('5. Intégrité des données (binaire vs texte) et en-têtes HTTP', () => {
        it('doit servir les fichiers binaires sans corruption d\'octets (Buffer exact)', () => {
            const response = new ResponseFake();
            pageRender.render(response, 'icon.png', 200, fixturePath);

            expect(response.statusCode).to.equal(200);
            expect(Buffer.isBuffer(response.body), "Les fichiers binaires doivent être servis sous forme de Buffer").to.be.true;

            const originalBuffer = fs.readFileSync(path.join(tmpDir, 'icon.png'));
            expect(Buffer.compare(response.body, originalBuffer)).to.equal(0, "Le buffer transmis doit être identique au fichier d'origine");
        });

        it('doit définir le charset UTF-8 directement dans Content-Type pour les fichiers texte', () => {
            const response = new ResponseFake();
            pageRender.render(response, 'index.html', 200, fixturePath);

            const contentType = response.getHeader('content-type');
            // En HTTP standard, charset est spécifié dans Content-Type: text/html; charset=utf-8
            // Un en-tête standalone "charset: utf8" n'est pas standard
            expect(contentType).to.match(/text\/html;\s*charset=utf-8/i);
        });
    });
});
