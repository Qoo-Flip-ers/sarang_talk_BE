const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Express API with Swagger",
      version: "1.0.2",
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
  app.use("/api-docs", swaggerUi.serve, async (req, res) => {
    res.send(swaggerUi.generateHTML(swaggerSpec)); // 최신 스펙 반영
  });

  app.get("/api-docs-whatsapp.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, max-age=0"
    );
    res.send(swaggerSpec);
  });

  console.log(
    `Swagger 문서는 http://localhost:${port}/api-docs 에서 확인할 수 있습니다`
  );
}

module.exports = swaggerDocs;
