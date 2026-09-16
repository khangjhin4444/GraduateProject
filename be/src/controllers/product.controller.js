const { neon } = require("@neondatabase/serverless");
const { Pool } = require("@neondatabase/serverless");
const sql = neon(process.env.DATABASE_URL);
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const getProducts = async (req, res) => {
  try {
    const type = req.query.type;
    const limit = parseInt(req.query.limit) || 8;
    const sort = req.query.sort || "default";
    const sub = req.query.sub || null;

    // 1. Giải mã Cursor từ Frontend gửi lên (nếu có)
    let cursor = null;
    if (req.query.cursor !== "null") {
      try {
        const decoded = Buffer.from(req.query.cursor, "base64").toString(
          "utf-8",
        );
        cursor = JSON.parse(decoded);
      } catch (e) {
        console.error("Lỗi parse cursor:", e);
      }
    }

    // 2. Cấu hình câu lệnh Sắp xếp (ORDER BY) và Điều kiện con trỏ (WHERE cursor)
    let orderBySql = sql`"ProductID" ASC`;
    let cursorCondition = sql``;

    if (sort === "price-asc") {
      orderBySql = sql`"Price" ASC, "ProductID" ASC`;
      if (cursor) {
        cursorCondition = sql`WHERE "Price" > ${cursor.value} OR ("Price" = ${cursor.value} AND "ProductID" > ${cursor.id})`;
      }
    } else if (sort === "price-desc") {
      orderBySql = sql`"Price" DESC, "ProductID" ASC`;
      if (cursor) {
        cursorCondition = sql`WHERE "Price" < ${cursor.value} OR ("Price" = ${cursor.value} AND "ProductID" > ${cursor.id})`;
      }
    } else if (sort === "name-asc") {
      orderBySql = sql`"Name" ASC, "ProductID" ASC`;
      if (cursor) {
        cursorCondition = sql`WHERE "Name" > ${cursor.value} OR ("Name" = ${cursor.value} AND "ProductID" > ${cursor.id})`;
      }
    } else if (sort === "name-desc") {
      orderBySql = sql`"Name" DESC, "ProductID" ASC`;
      if (cursor) {
        cursorCondition = sql`WHERE "Name" < ${cursor.value} OR ("Name" = ${cursor.value} AND "ProductID" > ${cursor.id})`;
      }
    } else {
      // Default: Chỉ sắp xếp theo ID
      orderBySql = sql`"ProductID" ASC`;
      if (cursor) {
        cursorCondition = sql`WHERE "ProductID" > ${cursor.id}`;
      }
    }

    // 3. Cấu hình bộ lọc Category và SubCategory
    const categoryFilter = sub
      ? sql`p."ProductType" = ${type} AND p."SubType" = ${sub}`
      : sql`p."ProductType" = ${type}`;

    // 4. Truy vấn CSDL
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
        ${cursorCondition}
        ORDER BY ${orderBySql}
        LIMIT ${limit}
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

    // 5. Tạo nextCursor cho lần gọi tiếp theo
    let nextCursor = null;
    if (products.length === limit) {
      const lastProduct = products[products.length - 1];
      let cursorData = { id: lastProduct.ProductID };

      // Lưu giá trị tie-breaker tương ứng với kiểu sort
      if (sort.startsWith("price")) {
        cursorData.value = lastProduct.Price;
      } else if (sort.startsWith("name")) {
        cursorData.value = lastProduct.Name;
      }

      // Mã hóa thành chuỗi Base64 để gửi về Frontend cho an toàn và gọn gàng
      nextCursor = Buffer.from(JSON.stringify(cursorData)).toString("base64");
    }

    res.status(200).json({
      success: true,
      limit: limit,
      count: products.length,
      data: products,
      nextCursor: nextCursor, // Frontend sẽ dùng chuỗi này thay cho `page`
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

    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * 12;
    const searchPattern = `%${keyword}%`;

    const products = await sql`
      SELECT * FROM (
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
        ORDER BY "ProductID" 
        LIMIT 12 OFFSET ${offset}
    `;

    res.status(200).json({ success: true, products });
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
