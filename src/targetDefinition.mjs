'use strict'
const DUMMY_BASE = "https://localhost:9443"; // base URL used to parse relative paths

export default {
    resolved : (path,pagesConfiguration) => {
        try {
            const result = new URL(path, DUMMY_BASE)
            if (pagesConfiguration.hasOwnProperty(result.pathname)) {
                return pagesConfiguration[result.pathname];
            }
            console.error("Target Definition : undefined target key but code 200 OK : how can it be possible ?");
            return undefined;
        }
        catch {
            console.error("Target Definition : invalid target key but code 200 OK : how can it be possible ?");
            return undefined;
        }
    }
}