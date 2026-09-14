'use strict'

export default {
    resolved : (path,pagesConfiguration) => {
        const result = new URL(path, "http://vvgc.ser")
        if (pagesConfiguration.hasOwnProperty(result.pathname)) {
            return pagesConfiguration[result.pathname];
        }
        //else console.error("Target DEfinition : undefined target key but code 200 OK : how can it be possible ?");
    }
}