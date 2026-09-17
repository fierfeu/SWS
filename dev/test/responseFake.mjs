'use strict';

export default class ResponseFake {
    constructor() {
        this.headers = {};
        this.statusCode = 200;
        this.body = null;
        this.ended = false;
    }

    get Headers() {
        return this.headers;
    }

    writeHead(statusCode, headers) {
        this.statusCode = statusCode;
        if (headers) {
            for (const [key, value] of Object.entries(headers)) {
                this.headers[key.toLowerCase()] = value;
            }
        }
    }

    setHeader(label, value) {
        this.headers[label.toLowerCase()] = value;
    }

    getHeader(label) {
        return this.headers[label.toLowerCase()];
    }

    hasHeader(label) {
        return Object.prototype.hasOwnProperty.call(this.headers, label.toLowerCase());
    }

    write(data) {
        if (this.body === null) {
            this.body = data;
        } else if (Buffer.isBuffer(this.body) && Buffer.isBuffer(data)) {
            this.body = Buffer.concat([this.body, data]);
        } else {
            this.body = String(this.body) + String(data);
        }
    }

    end(data) {
        if (data !== undefined) {
            this.write(data);
        }
        this.ended = true;
    }
}

