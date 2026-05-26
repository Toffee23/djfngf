import { config } from "dotenv";
config();

import swaggerJSDoc from "swagger-jsdoc";

const isProduction = process.env.NODE_ENV === "production";
const serverUrl = isProduction
  ? "https://web-production-aa7e3.up.railway.app"
  : "http://localhost:4000";
const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "My API",
      version: "1.0.0",
      description: "API documentation with Swagger",
    },
    servers: [
      {
        url: serverUrl,
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT", // Optional, helps describe the token format
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./routes/*.js"], // or wherever your Swagger comment blocks are
};

const swaggerSpec = swaggerJSDoc(options);
export default swaggerSpec;
