import assert from "node:assert"
import fs from "node:fs"
import https from "node:https"


const server = await import('../src/httpsServer.mjs')


describe('HTTPS Server verification', () => {

    it("it exist a class in httpsServer.mjs",() =>  {
        assert.equal(typeof server.default,'function')
    })

    describe ("exist a constructor for HTTPS SERVER initialisation", ()=>{
        it("exist a constructor",()=>{
            assert(server.default.constructor)
        })

        it("allow to define key and cert through a config data structure", ()=>{
            let conf={
                key : "key",
                cert : "cert"
            }
            let httpsServer= new server.default(conf)
            assert.equal(httpsServer.config.key,conf.key)
            assert.equal(httpsServer.config.cert,conf.cert)
            assert.equal(httpsServer.host,'localhost')
            assert.equal(httpsServer.port,9443)
        })

        it("allow to define a port in constructor", ()=>{
            let conf={
                key : "key",
                cert : "cert"
            }
            let port=443
            let httpsServer= new server.default(conf, port)
            assert.equal(httpsServer.port,port)
        })

        it("allow to define a host in constructor", ()=>{
            let conf={
                key : "key",
                cert : "cert"
            }
            let port=443
            let host="external.com"
            let httpsServer= new server.default(conf, port, host)
            assert.equal(httpsServer.host,host) 
        })
            
    })

    describe('it exist a start function wich launch the server', ()=>{
        it("exist a launch function",()=>{
            let conf={
                key : "key",
                cert : "cert"
            }
            let httpsServer= new server.default(conf)
            assert.equal(typeof httpsServer.start,'function')   
        })

        it("the start function create a new https server",()=>{
            let conf={}
            conf.key = fs.readFileSync("./certificats/server.key")
            conf.cert =fs.readFileSync("./certificats/server.cert")
            let httpsServer = new server.default(conf)
            httpsServer.start()
            assert(httpsServer.server)
            assert(httpsServer.server.close)
            assert.equal(httpsServer.server.key,conf.key)
            assert.equal(httpsServer.server.cert,conf.cert)
            httpsServer.server.close()  
        })

        it("start function allow to define a server handler",()=>{
            let ServConf={}
                       
            ServConf.key = fs.readFileSync("./certificats/server.key")
            ServConf.cert =fs.readFileSync("./certificats/server.cert")

            let ClientConf = {
                port: 8443,
                ca : fs.readFileSync("./certificats/server.cert"),
                //rejectUnauthorized: false
            }

            let httpsServer = new server.default(ServConf,8443) 
            httpsServer.start((req,res)=>{res.writeHead(200);res.end("The handler I wish")})
            
            https.get('https://localhost/',ClientConf, (res) => {
                let body=''
                assert(res.statusCode==200)

                res.on('data',(chunk) =>{
                    body+=chunk
                })

                res.on('end',()=>{
                    assert(body=="The handler I wish")
                })    
            })
        })
    
    })

})

describe('HTTP Server verification', () => {})