'use strict'

import fs from 'fs';
import path from 'path';

const MIME = {
    'txt':'text/plain',
    'html': 'text/html',
    'json': 'application/json',
    'css' : 'text/css',
    'js': 'application/javascript',
    'mjs': 'application/javascript',
    'jpg' : 'image/jpeg',
    'gif': 'image/gif',
    'png': 'image/png',
    'webp': 'image/webp',
    'svg': 'image/svg+xml',
    'jpeg': 'image/jpeg',
    'ttf': 'font/ttf',
    'woff': 'font/woff',
    'woff2': 'font/woff2',
    'ico' : 'image/x-icon',
    'webmanifest': 'application/manifest+json',
};

export default {
    render : (res,file,statusCode,pathTo) => {
        if (res&&file&&pathTo) {
            file=file.split(/[?#]/)[0]; // remove query string and fragment
            let ext = file.split('.').pop();
            if (MIME[ext.toLowerCase()]) 
            {
                ext = MIME[ext.toLowerCase()];
                let contentType = ext;
                let encoding;
                if (ext.split('/').shift()==='text'){encoding='utf8';contentType+='; charset=utf-8';}
                else {encoding = null};
                res.setHeader('content-type',contentType);
                const targetFilePath = path.resolve(pathTo,file);
                if(!targetFilePath.startsWith(pathTo)) {
                    let contentToWrite = "Error 403 Forbidden access";
                    res.writeHead(403);
                    res.write(contentToWrite);
                    res.end();
                    return;
                }
                try {                 
                    let data = fs.readFileSync(targetFilePath,encoding);
                    if (encoding){ res.setHeader('charset',encoding)};
                        let contentToWrite = data;
                        res.writeHead(statusCode);
                        res.write(contentToWrite);
                        res.end();
                        return;
                    }
                    catch(err) {
                        if (err.code === 'ENOENT') {
                            // Le fichier n'existe pas sur le disque -> 404 Not Found
                            res.writeHead(404);
                            res.write("Error 404: Not Found");
                        } else {
                            // Défaillance système (EACCES permission refusée, EIO erreur disque, etc.) -> 500 Internal Server Error
                            res.writeHead(500);
                            res.write("Error 500: Internal Server Error");
                        }
                        res.end();
                        return;
                    };
            } 
            else 
            {
                let contentToWrite = "Error 404";
                res.writeHead(404);
                res.write(contentToWrite);
                res.end();
                return;
            };
        } else {
            // to avoid server crash if res,file or pathTo is undefined
            let contentToWrite = "Error 404";
            res.writeHead(404);
            res.write(contentToWrite);
            res.end();
            return;
        };
    }
}

