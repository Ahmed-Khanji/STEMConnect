const express = require("express");
const registerGetRoutes = require("./get");
const registerPostRoutes = require("./post");
const registerPatchRoutes = require("./patch");
const registerDeleteRoutes = require("./delete");

const router = express.Router();

registerGetRoutes(router);
registerPostRoutes(router);
registerPatchRoutes(router);
registerDeleteRoutes(router);

module.exports = router;
