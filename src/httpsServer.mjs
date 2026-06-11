import https, { createServer } from "node:https"
import fs from "node:fs"

export default class httpsServer {
    config={}
    
    constructor(conf,port,host)  {
        this.config.key = conf.key
        this.config.cert = conf.cert
        this.host=(host?host:'localhost')
        this.port=(port?port:9443)
    }

    /**
     * initiate the server and begin to listen
     * @param {function} handler Function to handle request
     */
    start (handler) {
        this.server = createServer(this.config, handler)
        this.server.listen(this.port, this.host)
    }

    /**
     * stop function to halt server
     */
}

