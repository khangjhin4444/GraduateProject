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
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const getProductByID = async (req, res) => {
  const productId = req.params.id;
  try {
    const product = await sql`
      SELECT 
        p."ProductID",
        p."Name",
        p."Description",
        p."ProductType",
        p."SubType",
        COALESCE(
          (SELECT json_agg(
              json_build_object(
                'VariantID', pv."VariantID", 'Color', pv."Color", 
                'Price', pv."Price", 'Stock', pv."Stock", 'MainImage', pv."MainImage"
              )
            ) 
          FROM "product_variants" pv WHERE pv."ProductID" = p."ProductID"
          ), '[]'::json
        ) AS variants,
        COALESCE(
          (SELECT json_agg(pi."ImageUrl") 
          FROM "product_images" pi WHERE pi."ProductID" = p."ProductID"
          ), '[]'::json
        ) AS images
      FROM "product" p
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
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const getRelevantProduct = async (req, res) => {
  try {
    const productId = req.query.id;
    const type = req.query.type;
    const finalProducts = await sql`
      WITH RandomProducts AS (
        SELECT "ProductID", "Name", "Description"
        FROM "product" 
        WHERE "ProductType" = ${type} AND "ProductID" != ${productId}
        ORDER BY RANDOM()
        LIMIT 4
      )
      SELECT DISTINCT ON (rp."ProductID") 
          rp."ProductID", 
          rp."Name", 
          rp."Description", 
          pv."MainImage" AS "MainImage",
          pv."Price" AS "Price"
      FROM RandomProducts rp
      LEFT JOIN "product_variants" pv ON rp."ProductID" = pv."ProductID"
      ORDER BY rp."ProductID" ASC, pv."Color" ASC
    `;

    res.status(200).json({ success: true, data: finalProducts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const getProductsAdmin = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const type = req.query.type || null;
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 20);
    const offset = (page - 1) * limit;

    const products = await sql`
      WITH PaginatedProducts AS (
        SELECT 
          "ProductID", "Name", "Description", "ProductType", "SubType"
        FROM "product"
        WHERE "ProductType" = ${type}
        ORDER BY "SubType" ASC, "ProductID" ASC
        LIMIT ${limit + 1} OFFSET ${offset}
      )
      SELECT 
        pp.*,
        COALESCE((
          SELECT json_agg(
            json_build_object(
              'VariantID', pv."VariantID", 'Color', pv."Color", 
              'Price', pv."Price", 'Stock', pv."Stock", 'MainImage', pv."MainImage"
            )
          )
          FROM "product_variants" pv
          WHERE pv."ProductID" = pp."ProductID"
        ), '[]'::json) AS variants,
        COALESCE((
          SELECT json_agg(pi."ImageUrl")
          FROM "product_images" pi
          WHERE pi."ProductID" = pp."ProductID"
        ), '[]'::json) AS images
      FROM PaginatedProducts pp
      ORDER BY pp."SubType" ASC, pp."ProductID" ASC;
    `;
    const hasNextPage = products.length > limit;
    const data = hasNextPage ? products.slice(0, limit) : products;

    res.status(200).json({
      success: true,
      page,
      limit,
      hasNextPage,
      nextPage: hasNextPage ? page + 1 : null,
      data,
    });
  } catch (error) {
    console.error("❌ Lỗi phân trang:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
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
    console.log(keyword);
    console.log(searchPattern);

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
      WITH BaseSearch AS (
        SELECT DISTINCT ON (p."ProductID") 
            p."ProductID", p."Name", p."Description", p."ProductType", p."SubType",
            pv."MainImage" AS "MainImage", pv."Price" AS "Price"
        FROM "product" p
        LEFT JOIN "product_variants" pv ON p."ProductID" = pv."ProductID"
        WHERE p."Name" ILIKE ${searchPattern} OR p."Description"::text ILIKE ${searchPattern}
        ORDER BY p."ProductID" ASC, pv."Color" ASC
      ),
      PaginatedSearch AS (
        SELECT * FROM BaseSearch
        ORDER BY ${orderBySql}
        LIMIT ${limit + 1} OFFSET ${offset}
      )
      SELECT 
        ps.*,
        (
          SELECT json_agg(
            json_build_object(
              'colorText', pv_sub."Color",
              'image', pv_sub."MainImage",
              'price', pv_sub."Price"
            )
          )
          FROM "product_variants" pv_sub
          WHERE pv_sub."ProductID" = ps."ProductID"
        ) AS variants
      FROM PaginatedSearch ps
      ORDER BY ${orderBySql}
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
    res.status(500).json({ success: false, message: "Internal Server Error" });
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
    res.status(500).json({ success: false, message: "Internal Server Error" });
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
    res.status(500).json({ success: false, message: "Internal Server Error" });
  } finally {
    // QUAN TRỌNG: Phải trả kết nối lại cho Pool, nếu không Server sẽ bị treo sau vài lần gọi
    client.release();
  }
};

const addProductAdmin = async (req, res) => {
  const {
    uploadMultipleToImgBB,
    uploadToImgBB,
  } = require("../utils/uploadImage");

  try {
    const {
      name,
      description,
      productType,
      subType,
      variants: variantsJson,
    } = req.body;
    const variants = JSON.parse(variantsJson);
    const parsedDescription = JSON.parse(description);

    // Validate required fields
    console.log(name, description, productType, subType, variants);
    if (
      !name ||
      !parsedDescription ||
      !productType ||
      !subType ||
      !variants ||
      variants.some((v) => !v.color || v.price <= 0 || v.stock < 0)
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid product information" });
    }

    // Validate unique colors
    const colors = variants.map((v) => v.color.trim().toLowerCase());
    const uniqueColors = new Set(colors);
    if (uniqueColors.size !== variants.length) {
      return res
        .status(400)
        .json({ success: false, message: "Variant colors must be unique." });
    }

    // Get uploaded files from multer
    const variantImageFiles = req.files?.variantImages || [];
    const extraImageFiles = req.files?.extraImages || [];

    // Validate variant image count matches variants
    if (variantImageFiles.length !== variants.length) {
      return res.status(400).json({
        success: false,
        message: `Expected ${variants.length} variant image(s), but received ${variantImageFiles.length}`,
      });
    }

    // Upload variant images to ImgBB
    let variantImageURLs;
    try {
      variantImageURLs = await uploadMultipleToImgBB(variantImageFiles);
    } catch (uploadError) {
      return res.status(500).json({
        success: false,
        message: `Failed to upload variant image: ${uploadError.message}`,
      });
    }

    // Upload extra images to ImgBB
    let extraImageURLs = [];
    if (extraImageFiles.length > 0) {
      try {
        extraImageURLs = await uploadMultipleToImgBB(extraImageFiles);
      } catch (uploadError) {
        return res.status(500).json({
          success: false,
          message: `Failed to upload extra image: ${uploadError.message}`,
        });
      }
    }

    // Insert product into database
    const result = await sql`
      INSERT INTO "product" ("Name", "Description", "ProductType", "SubType")
      VALUES (${name}, ${JSON.stringify(parsedDescription)}, ${productType}, ${subType})
      RETURNING "ProductID"
    `;
    const newProductID = result[0].ProductID;

    // Insert variants with uploaded image URLs
    const insertVariantQueries = variants.map(
      (v, i) => sql`
        INSERT INTO "product_variants" ("ProductID", "Color", "Price", "Stock", "MainImage")
        VALUES (${newProductID}, ${v.color}, ${v.price}, ${v.stock}, ${variantImageURLs[i]})
      `,
    );
    await sql.transaction(insertVariantQueries);

    // Insert extra images
    if (extraImageURLs.length > 0) {
      const insertImageQueries = extraImageURLs.map(
        (imageUrl) => sql`
          INSERT INTO "product_images" ("ProductID", "ImageUrl")
          VALUES (${newProductID}, ${imageUrl})
        `,
      );
      await sql.transaction(insertImageQueries);
    }

    res.status(200).json({
      success: true,
      message: "Add Product success",
    });
  } catch (error) {
    console.error("❌ Error adding product:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

const editProductAdmin = async (req, res) => {
  const {
    uploadMultipleToImgBB,
    uploadToImgBB,
  } = require("../utils/uploadImage");

  try {
    const productId = req.params.id;
    const {
      name,
      description,
      productType,
      subType,
      variants: variantsJson,
      existingExtraImages: existingExtraImagesJson,
    } = req.body;

    const variants = JSON.parse(variantsJson);
    const parsedDescription = JSON.parse(description);
    const existingExtraImages = existingExtraImagesJson
      ? JSON.parse(existingExtraImagesJson)
      : [];

    // Validate required fields
    if (
      !name ||
      !parsedDescription ||
      !productType ||
      !subType ||
      !variants ||
      variants.some((v) => !v.color || v.price <= 0 || v.stock < 0)
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid product information" });
    }

    // Validate unique colors
    const colors = variants.map((v) => v.color.trim().toLowerCase());
    if (new Set(colors).size !== variants.length) {
      return res
        .status(400)
        .json({ success: false, message: "Variant colors must be unique." });
    }

    // ===== Lấy variant hiện có trong DB =====
    const existingVariants = await sql`
      SELECT "VariantID", "Color", "MainImage"
      FROM "product_variants"
      WHERE "ProductID" = ${productId}
    `;
    const existingMap = new Map(
      existingVariants.map((v) => [String(v.VariantID), v]),
    );

    // Validate: variantId gửi lên phải thuộc về sản phẩm này
    const incomingIds = new Set();
    for (const v of variants) {
      if (v.variantId) {
        const id = String(v.variantId);
        if (!existingMap.has(id) || incomingIds.has(id)) {
          return res.status(400).json({
            success: false,
            message: `Invalid variantId: ${v.variantId}`,
          });
        }
        incomingIds.add(id);
      }
    }

    // Get uploaded files from multer
    const variantImageFiles = req.files?.variantImages || [];
    const extraImageFiles = req.files?.extraImages || [];

    // Process variant images
    let newFileIndex = 0;
    const variantImageURLs = [];
    for (const v of variants) {
      if (v.existingImage) {
        variantImageURLs.push(v.existingImage);
      } else {
        if (newFileIndex >= variantImageFiles.length) {
          return res.status(400).json({
            success: false,
            message: "Missing variant image file",
          });
        }
        try {
          const file = variantImageFiles[newFileIndex];
          const url = await uploadToImgBB(file.buffer, file.originalname);
          variantImageURLs.push(url);
          newFileIndex++;
        } catch (uploadError) {
          return res.status(500).json({
            success: false,
            message: `Failed to upload variant image: ${uploadError.message}`,
          });
        }
      }
    }

    // Upload new extra images
    let newExtraImageURLs = [];
    if (extraImageFiles.length > 0) {
      try {
        newExtraImageURLs = await uploadMultipleToImgBB(extraImageFiles);
      } catch (uploadError) {
        return res.status(500).json({
          success: false,
          message: `Failed to upload extra image: ${uploadError.message}`,
        });
      }
    }

    const allExtraImageURLs = [...existingExtraImages, ...newExtraImageURLs];

    // ===== Xây dựng các query =====

    // 1. Update thông tin sản phẩm
    const updateProductQuery = sql`
      UPDATE "product"
      SET "Name" = ${name},
          "Description" = ${JSON.stringify(parsedDescription)},
          "ProductType" = ${productType},
          "SubType" = ${subType}
      WHERE "ProductID" = ${productId}
    `;

    // 2. Xóa những variant admin đã bỏ đi (chạy trước để tránh xung đột unique color)
    const deleteRemovedVariantQueries = existingVariants
      .filter((ev) => !incomingIds.has(String(ev.VariantID)))
      .map(
        (ev) => sql`
          DELETE FROM "product_variants"
          WHERE "VariantID" = ${ev.VariantID} AND "ProductID" = ${productId}
        `,
      );

    // 3. Update variant cũ / insert variant mới
    const upsertVariantQueries = variants.map((v, i) => {
      if (v.variantId) {
        return sql`
          UPDATE "product_variants"
          SET "Color" = ${v.color},
              "Price" = ${v.price},
              "Stock" = ${v.stock},
              "MainImage" = ${variantImageURLs[i]}
          WHERE "VariantID" = ${v.variantId} AND "ProductID" = ${productId}
        `;
      }
      return sql`
        INSERT INTO "product_variants" ("ProductID", "Color", "Price", "Stock", "MainImage")
        VALUES (${productId}, ${v.color}, ${v.price}, ${v.stock}, ${variantImageURLs[i]})
      `;
    });

    // 4. Ảnh phụ: giữ cách cũ (bảng này không bị giỏ hàng tham chiếu)
    const extraImageQueries = [
      sql`DELETE FROM "product_images" WHERE "ProductID" = ${productId}`,
      ...allExtraImageURLs.map(
        (imageUrl) => sql`
          INSERT INTO "product_images" ("ProductID", "ImageUrl")
          VALUES (${productId}, ${imageUrl})
        `,
      ),
    ];

    await sql.transaction([
      updateProductQuery,
      ...deleteRemovedVariantQueries,
      ...upsertVariantQueries,
      ...extraImageQueries,
    ]);

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
    });
  } catch (error) {
    console.error("❌ Error editing product:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
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
  editProductAdmin,
  getProductByKeyword,
};
