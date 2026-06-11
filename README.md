# SWS
Serveur web hhtps et http sous node en js vanilla

ce serveur contien une admin accessible via http et un serveur https pour servir un PWA.

SWS  -|
      |- access
      |- admin
      |- certificats // contains all SSL certif and is not manage in configuration
      |- deploy
      |- dev // contains files used only for devlopment purpose : never deployed this folder
        | - test
      |- src
        | httpsServer.mjs
        | httpServer.mjs
        | index.js
        | pageRender.mjs
        | targetDefinition.mjs
        | urlSiteValidator.mjs
        | webHandler.mjs
      | package
      | start
