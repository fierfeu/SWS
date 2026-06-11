'use strict'

import handler from './webHandler.js';
import http from 'http';
import fs from 'fs';

export function run (hostname, port) {
    let log ='';
    let webserver; // instance de server web pour les accès en http

    webserver = http.createServer();

    webserver.on('connection',(socket)=>{
        let now =new Date();
        log = socket.remoteAddress + ' - - ' + now.toString() +' ';
    });

    webserver.on ('request',(req,res)=>{
        log += req.method + ' ' + req.url + ' ' + req.httpVersion + ' ' +res.statusCode + ' - \r';
        fs.appendFile('webServer.log',log,()=>{});
        handler(req,res)
    });

    webserver.listen(port, hostname);

    return webserver
};

export function stop (webserver) {
    webserver.close();
    webserver.closeIdleConnections();

    return null
};
