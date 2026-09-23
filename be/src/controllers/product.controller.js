const { neon } = require("@neondatabase/serverless");
const { Pool } = require("@neondatabase/serverless");
const sql = neon(process.env.DATABASE_URL);
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const getProducts = async (req, res) => {
  try {
    const type = req.query.type;
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 8, 1), 20);
    const offset = (page - 1) * limit;
    const sort = req.query.sort || "default";
    const sub = req.query.sub || null;

    // Fetch one extra product to determine whether another page exists.
    let orderBySql = sql`"ProductID" ASC`;

    if (sort === "price-asc") {
      orderBySql = sql`"Price" ASC, "ProductID" ASC`;
    } else if (sort === "price-desc") {
      orderBySql = sql`"Price" DESC, "ProductID" ASC`;
    } else if (sort === "name-asc") {
      orderBySql = sql`"Name" ASC, "ProductID" ASC`;
    } else if (sort === "name-desc") {
      orderBySql = sql`"Name" DESC, "ProductID" ASC`;
    }

    const categoryFilter =
      sub !== "undefined" && sub != null
        ? sql`p."ProductType" = ${type} AND p."SubType" = ${sub}`
        : sql`p."ProductType" = ${type}`;

    const products = await sql`
      WITH BaseProducts AS (
        SELECT DISTINCT ON (p."ProductID") 
            p."ProductID", 
            p."Name", 
            p."Description", 
            p."ProductType", 
            p."SubType",
            pv."MainImage" AS "MainImage",
            pv."Price" AS "Price"
        FROM "product" p
        LEFT JOIN "product_variants" pv ON p."ProductID" = pv."ProductID"
        WHERE ${categoryFilter}
        ORDER BY p."ProductID" ASC, pv."Color" ASC
      ),
      PaginatedProducts AS (
        SELECT * FROM BaseProducts
        ORDER BY ${orderBySql}
        LIMIT ${limit + 1} OFFSET ${offset}
      )
      SELECT 
        pp.*,
        (
          SELECT json_agg(
            json_build_object(
              'colorText', pv_sub."Color",
              'image', pv_sub."MainImage",
              'price', pv_sub."Price"
            )
          )
          FROM "product_variants" pv_sub
          WHERE pv_sub."ProductID" = pp."ProductID"
        ) AS variants
      FROM PaginatedProducts pp
      ORDER BY ${orderBySql}
    `;

    const hasNextPage = products.length > limit;
    const data = hasNextPage ? products.slice(0, limit) : products;

    res.status(200).json({
      success: true,
      page,
      limit: limit,
      hasNextPage,
      nextPage: hasNextPage ? page + 1 : null,
      data,
    });
  } catch (error) {
    console.error("Error catch:", error);
    res.status(500).json({ success: false, message: "Lỗi lấy dữ liệu!" });
  }
};

const getProductByID = async (req, res) => {
  const productId = req.params.id;
  try {
    const product = await sql`
      WITH VariantList AS (
        SELECT 
          "ProductID",
          json_agg(
            json_build_object(
              'VariantID', "VariantID",
              'Color', "Color",
              'Price', "Price",
              'Stock', "Stock",
              'MainImage', "MainImage"
            )
          ) AS variants
        FROM "product_variants"
        GROUP BY "ProductID"
      ),
      ImageList AS (
        SELECT 
          "ProductID",
          json_agg("ImageUrl") AS images
        FROM "product_images"
        GROUP BY "ProductID"
      )
      SELECT 
        p."ProductID",
        p."Name",
        p."Description",
        p."ProductType",
        p."SubType",
        COALESCE(v.variants, '[]'::json) AS variants,
        COALESCE(i.images, '[]'::json) AS images
      FROM "product" p
      LEFT JOIN VariantList v ON p."ProductID" = v."ProductID"
      LEFT JOIN ImageList i ON p."ProductID" = i."ProductID"
      WHERE p."ProductID" = ${productId};
    `;

    if (product.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy sản phẩm!" });
    }

    res.status(200).json({ success: true, data: product[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Lỗi Server!" });
  }
};

const getRelevantProduct = async (req, res) => {
  try {
    const productId = req.query.id;
    const type = req.query.type;
    const idRecords = await sql`
      SELECT "ProductID" 
      FROM "product" 
      WHERE "ProductType" = ${type} AND "ProductID" != ${productId}
    `;

    if (idRecords.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }
    const allIds = idRecords.map((record) => record.ProductID);
    const randomIds = allIds.sort(() => 0.5 - Math.random()).slice(0, 4);
    const finalProducts = await sql`
      SELECT DISTINCT ON (p."ProductID") 
          p."ProductID", 
          p."Name", 
          p."Description", 
          pv."MainImage" AS "MainImage",
          pv."Price" AS "Price"
      FROM "product" p
      LEFT JOIN "product_variants" pv ON p."ProductID" = pv."ProductID"
      
      WHERE p."ProductID" = ANY(${randomIds}) 
      ORDER BY p."ProductID" ASC, pv."Color" ASC
    `;

    res.status(200).json({ success: true, data: finalProducts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

const getProductsAdmin = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const type = req.query.type || null;
    const limit = 10;
    const offset = (page - 1) * limit;

    const products = await sql`
      WITH VariantList AS (
        SELECT 
          "ProductID",
          json_agg(
            json_build_object(
              'VariantID', "VariantID",
              'Color', "Color",
              'Price', "Price",
              'Stock', "Stock",
              'MainImage', "MainImage"
            )
          ) AS variants
        FROM "product_variants"
        GROUP BY "ProductID"
      ),
      ImageList AS (
        SELECT 
          "ProductID",
          json_agg("ImageUrl") AS images
        FROM "product_images"
        GROUP BY "ProductID"
      )
      SELECT 
        p."ProductID",
        p."Name",
        p."Description",
        p."ProductType",
        p."SubType",
        COALESCE(v.variants, '[]'::json) AS variants,
        COALESCE(i.images, '[]'::json) AS images
      FROM "product" p
      LEFT JOIN VariantList v ON p."ProductID" = v."ProductID"
      LEFT JOIN ImageList i ON p."ProductID" = i."ProductID"
      WHERE p."ProductType" = ${type}
      ORDER BY p."SubType" ASC,p."ProductID" ASC
      LIMIT ${limit} OFFSET ${offset}
    `;

    res.status(200).json({
      success: true,
      currentPage: page,
      limit: limit,
      count: products.length,
      data: products,
    });
  } catch (error) {
    console.error("❌ Lỗi phân trang:", error);
    res.status(500).json({ success: false, message: "Lỗi lấy dữ liệu!" });
  }
};

const getProductByKeyword = async (req, res) => {
  try {
    const keyword = req.query.keyword || "";

    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 12, 1), 20);
    const offset = (page - 1) * limit;
    const sort = req.query.sort || "default";
    const searchPattern = `%${keyword}%`;

    let orderBySql = sql`"ProductID" ASC`;

    if (sort === "price-asc") {
      orderBySql = sql`"Price" ASC, "ProductID" ASC`;
    } else if (sort === "price-desc") {
      orderBySql = sql`"Price" DESC, "ProductID" ASC`;
    } else if (sort === "name-asc") {
      orderBySql = sql`"Name" ASC, "ProductID" ASC`;
    } else if (sort === "name-desc") {
      orderBySql = sql`"Name" DESC, "ProductID" ASC`;
    }

    const products = await sql`
      SELECT
        standard_products.*,
        (
          SELECT json_agg(
            json_build_object(
              'colorText', pv_sub."Color",
              'image', pv_sub."MainImage",
              'price', pv_sub."Price"
            )
          )
          FROM "product_variants" pv_sub
          WHERE pv_sub."ProductID" = standard_products."ProductID"
        ) AS variants
      FROM (
          SELECT DISTINCT ON (p."ProductID") 
              p."ProductID", 
              p."Name", 
              p."Description", 
              p."ProductType", 
              p."SubType",
              pv."MainImage" AS "MainImage",
              pv."Price" AS "Price"
          FROM "product" p
          LEFT JOIN "product_variants" pv ON p."ProductID" = pv."ProductID"
          WHERE p."Name" ILIKE ${searchPattern} 
             OR p."Description" ILIKE ${searchPattern}
          ORDER BY p."ProductID"
        ) as standard_products
        ORDER BY ${orderBySql}
        LIMIT ${limit + 1} OFFSET ${offset}
    `;

    const hasNextPage = products.length > limit;
    const data = hasNextPage ? products.slice(0, limit) : products;

    res.status(200).json({
      success: true,
      page,
      limit,
      hasNextPage,
      nextPage: hasNextPage ? page + 1 : null,
      products: data,
    });
  } catch (error) {
    console.error("Lỗi tìm kiếm:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

const deleteProductAdmin = async (req, res) => {
  try {
    const variantId = req.params.id;
    const deleteProduct = await sql`
  WITH deleted_variant AS (
    DELETE FROM "product_variants" 
    WHERE "VariantID" = ${variantId}
    RETURNING "ProductID"
  )
  SELECT p."ProductType"
  FROM "product" p
  INNER JOIN deleted_variant dv ON p."ProductID" = dv."ProductID";
`;
    res.status(200).json({
      success: true,
      message: "Sản phẩm đã được xóa!",
      type: deleteProduct[0].ProductType,
    });
  } catch (error) {
    console.error("❌ Lỗi xóa sản phẩm:", error);
    res.status(500).json({ success: false, message: "Lỗi xóa sản phẩm!" });
  }
};

const updateProductVariantAdmin = async (req, res) => {
  const { VariantID, Color, Price, Stock, ProductType, SubType, ProductID } =
    req.body;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await sql`
      UPDATE "product_variants"
      SET 
        "Color" = ${Color}, 
        "Price" = ${Price},
        "Stock" = ${Stock}
      WHERE "VariantID" = ${VariantID}
    `;
    await sql`
      UPDATE "product"
      SET
        "ProductType" = ${ProductType},
        "SubType" = ${SubType}
      WHERE "ProductID" = ${ProductID}
    `;
    await client.query("COMMIT");
    res.status(200).json({
      success: true,
      message: "Update success",
      newType: ProductType,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Error when update" });
  } finally {
    // QUAN TRỌNG: Phải trả kết nối lại cho Pool, nếu không Server sẽ bị treo sau vài lần gọi
    client.release();
  }
};

const addProductAdmin = async (req, res) => {
  const { name, description, productType, subType, variants, extraImages } =
    req.body;
  console.log(name, description, productType, subType, variants, extraImages);
  if (
    !name ||
    !description ||
    !productType ||
    !subType ||
    !variants ||
    variants.some((v) => !v.color || v.price <= 0 || v.stock < 0)
  ) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid product information" });
  }
  const colors = variants.map((v) => v.color.trim().toLowerCase());
  const uniqueColors = new Set(colors);
  const isUnique = uniqueColors.size === variants.length;
  if (!isUnique) {
    return res
      .status(400)
      .json({ success: false, message: "Variant colors must be unique." });
  }
  try {
    const result = await sql`
            INSERT INTO "product" ("Name", "Description", "ProductType", "SubType")
            VALUES (${name}, ${description}, ${productType}, ${subType})
            RETURNING "ProductID"
          `;
    const newProductID = result[0].ProductID;
    const insertQueries = variants.map(
      (v) => sql`
            INSERT INTO "product_variants" ("ProductID", "Color", "Price", "Stock", "MainImage")
            VALUES (${newProductID}, ${v.color}, ${v.price}, ${v.stock}, ${v.main_image})
          `,
    );

    await sql.transaction(insertQueries);
    if (extraImages) {
      const insertQueries = extraImages.map(
        (image) => sql`
          INSERT INTO "product_images" ("ProductID", "ImageUrl")
          VALUES (${newProductID}, ${image})
        `,
      );
      await sql.transaction(insertQueries);
    }
    res.status(200).json({
      success: true,
      message: "Add Product success",
    });
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  getProductByID,
  getProducts,
  getRelevantProduct,
  deleteProductAdmin,
  getProductsAdmin,
  updateProductVariantAdmin,
  addProductAdmin,
  getProductByKeyword,
};
