'use strict'
const DUMMY_BASE = "https://localhost:9443"; // base URL used to parse relative paths

export default {
    validate: (path, pagesConfiguration) => {
        if (typeof path !== 'string' || !pagesConfiguration) {
            return 404;
        }
        try {
            const result = new URL(path, DUMMY_BASE);
            // Si l'URL fournie était absolue et visait un autre domaine que la base interne,
            // on la refuse pour éviter les attaques de type SSRF / Open Redirect
            if (result.origin !== DUMMY_BASE) {
                return 404;
            }
            if (Object.hasOwn(pagesConfiguration, result.pathname)) {
                return 200;
            }
            return 404;
        } catch {
            return 404;
        }
    }
};