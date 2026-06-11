'use strict'
import fs from 'fs'
import urlSiteValidator from './urlSiteValidator.js'
import targetDefinition from './targetDefinition.js'
import pageRender from './pageRender.js'



// Definition de la structure du site em mode KISS
// Remember taht path are all based on current dir path
let routesPagesConf ={
    '/':'/../web/html/admin.html',
    '/index.html':'/../web/html/admin.html',
    '/admin' : '/../web/html/admin.html',
    '/admin.html':'/../web/html/admin.html',
    '/adminLogo.jpg':'/../web/image/logo.jpg'
}

let serverConf = {
    "pageLoaded": false,
    "packagesLoaded":0,
    "usersDefined":0
}

const PATHTO = import.meta.dirname

function retrievePayLoad (req) {
    req.on ('data',(chunk)=> {
        req.body=''
        req.body+=decodeURIComponent(chunk)
    })
    req.on('end',() => {
        let payLoad = req.body.split(/[=&]/)
        req.body=[]
        for (let i=0; i< payLoad.length; i+=2) {
            req.body[payLoad[i]]=payLoad[i+1]
        }
    })
    
}

function rendAGet(code, target,req,res) {
    code = urlSiteValidator.validate(req.url,routesPagesConf);
    if (code===200) {
            target = targetDefinition.resolved(req.url,routesPagesConf);
    };
    pageRender.render(res,target,code,PATHTO);
}

export default function handler (req,res) {
        switch (req.method) {
            case 'POST' :
                retrievePayLoad(req)
                req.on('close',async ()=>{
                    switch(req.body["action"]) {
                        case 'addMainPage' :
                            // verify that route file is accessible
                            const filePath = req.body["filePathName"]
                            fs.access(filePath, (err)=>{
                                if(err) {
                                    res.writeHead(400, {"Content-type":"text/html"})
                                    res.end("<dialog open style=\"text-align:center;color:red\">400 bad route file path <br> Click on backward to go back to form</dialog>")
                                }
                                else {
                                    // load datas
                                    let data = fs.readFileSync(filePath,{ encoding: 'utf8' })
                                    data= JSON.parse(data)
                                    if(req.body['singletonName'][0]!='/') req.body['singletonName']='/'+req.body['singletonName']
                                    let singleton = data[req.body['singletonName']]
                                    if(singleton) {
                                        fs.access(PATHTO+singleton, async (err)=>{
                                            if(err) {
                                                res.writeHead(400, {"Content-type":"text/html"})
                                                res.end("<dialog open style=\"text-align:center;color:red\">400 bad singleton name or not reachable on server side <br> Click on backward to go back to form</dialog>")
                                            }
                                            else {
                                                if(singleton[0]=='/') singleton=singleton.slice(1)
                                                const Game = await import(singleton)
                                                if (typeof Game.default.prototype.addPackage == 'function') {
                                                    for (let key in data) {
                                                        routesPagesConf[key]= data[key]
                                                    }
                                                    serverConf.pageLoaded=true
                                                    serverConf.pageDescriptor=req.body
                                                    if (req.body["webRootPathName"]) {
                                                        req.url=req.body["webRootPathName"]
                                                        rendAGet(404,PATHTO +'../web/html/404.html',req,res)
                                                    }
                                                }
                                                else {
                                                    res.writeHead(400, {"Content-type":"text/html"})
                                                    res.end("<dialog open style=\"text-align:center;color:red\">400 bad class prototype : no addPackage function available <br> Click on backward to go back to form</dialog>")    
                                                }
                                            }
                                        })
                                    }
                                    else {
                                        res.writeHead(400, {"Content-type":"text/html"})
                                        res.end("<dialog open style=\"text-align:center;color:red\">400 singleton not routable <br> Click on backward to go back to form</dialog>")    
                                      
                                    }
                                }
                            })
                            break
                        case 'addAPackage':
                            let singleton = routesPagesConf[serverConf.pageDescriptor['singletonName']]
                            const data=req.body
                            console.log(singleton)
                            if(singleton[0]=='/') singleton=singleton.slice(1)
                            const Game = await import(singleton)
                            console.log(typeof Game.default.prototype.addPackage)
                            console.log(req.body)
                            if(Game.default.prototype.addPackage(data)) {
                                req.url = serverConf.pageDescriptor['webRootPathName']
                                rendAGet(404,PATHTO +'../web/html/404.html',req,res)
                            }
                            else {
                                res.writeHead(400, {"Content-type":"text/html"})
                                res.end("<dialog open style=\"text-align:center;color:red\">400 bad Package : Addition failed</dialog>")
                            }
                            break
                        default :
                            console.log('unrecognized action for POST Method')
                            res.writeHead(406, {'Content-Type':'txt/html'})
                            res.end('Action requested not recognized')
                            break;
                    }
                })
                break
            case 'PUT':
            case 'GET':
                let code = 404;
                let target =PATHTO +'../web/html/404.html'; //TODO remove this hard coded value but today it's simple
                rendAGet(code,target,req,res)
                break
        }

    
    }

