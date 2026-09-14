'use strict'

export default {
    validate : (path, pagesConfiguration) => {
        const result = new URL(path, "http://vvgc.ser")
        if (pagesConfiguration) {
            
            if (pagesConfiguration.hasOwnProperty(result.pathname)) {
                return 200;
            }
        }
        return 404;
    }
}