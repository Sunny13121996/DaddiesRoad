const options = {
  openapi: "OpenAPI 3",
  language: "en-US",
  disableLogs: false,
  autoHeaders: false,
  autoQuery: false,
  autoBody: false,
};

const generateSwagger = require("swagger-autogen")();
const fs              = require('fs');

const swaggerDocument = {
  info: {
    version: "1.0.0",
    title: "DaddiesRoad",
    description: "DaddiesRoad",
    contact: {
      name: "API Support",
      email: "ss691601@gmail.com",
    },
  },
  host: "localhost:7001/api",
  basePath: "/",
  schemes: ["http"],
  consumes: ["application/json"],
  produces: ["application/json"],
  tags: [
    {
      name: "APIS",
      description: "Rest API",
    },
  ],
  securityDefinitions: {
    BearerAuth: {
      type: "apiKey",
      name: "Authorization",
      in: "header",
      description: "Enter your bearer token in the format: Bearer <token>",
    },
  },
  definitions: {
    successResponse: {
      code: 200,
      message: "Success",
    },
    "errorResponse.401": {
      code: 401,
      message: "Unauthorized access or invalid token.",
    },
    "errorResponse.406": {
      code: 406,
      message: "Not acceptable or user lacks access.",
    },
    "errorResponse.500": {
      code: 500,
      message: "An unexpected error occurred on the server. Please try again later.",
    },
    "errorResponse.404": {
      code: 404,
      message: "The requested resource could not be found on the server.",
    },
  },
  security: [{ BearerAuth: [] }], // Global security if all routes require authorization
};

const swaggerFile  = "./docs/swagger.json";
const apiRouteFile = ["../routes/restRouter.js"];

// Generate the Swagger JSON
generateSwagger(swaggerFile, apiRouteFile, swaggerDocument).then(() => {
  const swaggerData = JSON.parse(fs.readFileSync(swaggerFile, 'utf8'));

  delete swaggerData.paths['/get-trips-webhook'];
  fs.writeFileSync(swaggerFile, JSON.stringify(swaggerData, null, 2));
});


// TO GENERATE FILE
// run node ./docs/swagger.js
/*
  Before All 
  npm install swagger-ui-express
  npm install swagger-autogen

  //https://medium.com/@im_AnkitTiwari/swaggerizing-your-node-js-rest-api-a-step-by-step-guide-267255bf8bbe
*/