const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Express API with Swagger",
      version: "1.0.1",
      description:
        "A simple CRUD API application with Express and documented with Swagger",
    },
    servers: [
      {
        url: process.env.SERVICE_DOMAIL || "http://localhost:3000",
      },
    ],
  },
  apis: ["./routes/*.js"], // 경로를 적절히 수정하세요
};

const swaggerSpec = swaggerJsdoc(options);

function swaggerDocs(app, port) {
  app.use("/api-docs-whatsapp", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get("/api-docs-whatsapp.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });

  console.log(
    `Swagger docs available at http://localhost:${port}/api-docs-whatsapp`
  );
}

module.exports = swaggerDocs;
