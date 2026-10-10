const assert = require("node:assert/strict");
const Module = require("node:module");
const { test } = require("node:test");

const queryState = {
  totalCount: 25,
  products: [],
  countQueries: [],
};

function mockSql(strings, ...values) {
  const queryText = strings.join("?");
  if (
    queryText.trim().startsWith('"ProductID"') ||
    queryText.trim().startsWith('p."ProductType"')
  ) {
    return { queryText, values };
  }

  if (queryText.includes("COUNT(")) {
    queryState.countQueries.push({ queryText, values });
    return Promise.resolve([{ totalCount: queryState.totalCount }]);
  }

  if (queryText.includes("WITH")) {
    return Promise.resolve(queryState.products);
  }

  throw new Error(`Unexpected SQL query: ${queryText}`);
}

const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (request === "@neondatabase/serverless") {
    return {
      neon: () => mockSql,
      Pool: class {},
    };
  }
  return originalLoad.call(this, request, parent, isMain);
};

process.env.DATABASE_URL = "postgres://test";
const productController = require("../src/controllers/product.controller");
Module._load = originalLoad;

function createResponse() {
  return {
    statusCode: undefined,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

test("product listings return total pages based on the filtered product count", async () => {
  queryState.countQueries = [];
  queryState.totalCount = 25;
  queryState.products = Array.from({ length: 9 }, (_, index) => ({
    ProductID: index + 1,
  }));

  const categoryResponse = createResponse();
  await productController.getProducts(
    {
      query: {
        type: "KeyboardKit",
        sub: "75%",
        page: "1",
        limit: "8",
      },
    },
    categoryResponse,
  );

  assert.equal(categoryResponse.statusCode, 200);
  assert.equal(categoryResponse.body.totalPages, 4);
  assert.equal(categoryResponse.body.hasNextPage, true);
  assert.equal(categoryResponse.body.data.length, 8);
  assert.equal(queryState.countQueries[0].values[0].values[0], "KeyboardKit");
  assert.equal(queryState.countQueries[0].values[0].values[1], "75%");

  queryState.countQueries = [];
  queryState.products = Array.from({ length: 11 }, (_, index) => ({
    ProductID: index + 1,
  }));
  const searchResponse = createResponse();
  await productController.getProductByKeyword(
    {
      query: {
        keyword: "red switches",
        page: "2",
        limit: "10",
      },
    },
    searchResponse,
  );

  assert.equal(searchResponse.statusCode, 200);
  assert.equal(searchResponse.body.totalPages, 3);
  assert.equal(searchResponse.body.hasNextPage, true);
  assert.equal(
    queryState.countQueries[0].values[0],
    "%red switches%",
  );
});

test("empty filtered results report zero total pages", async () => {
  queryState.totalCount = 0;
  queryState.products = [];

  const response = createResponse();
  await productController.getProducts(
    { query: { type: "Keycap", page: "1", limit: "8" } },
    response,
  );

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.totalPages, 0);
  assert.deepEqual(response.body.data, []);
});
