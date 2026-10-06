const { neon } = require("@neondatabase/serverless");
const sql = neon(process.env.DATABASE_URL);

const getOrders = async (req, res) => {
  try {
    const currentUserId = req.userId;
    const status = req.query.status;
    const page = Number(req.query.page ?? 1);
    const limit = 5;

    if (!Number.isSafeInteger(page) || page < 1) {
      return res.status(400).json({
        success: false,
        message: "Page must be a positive integer.",
      });
    }

    const offset = (page - 1) * limit;
    const orders = await sql`
      SELECT 
        o."OrderID",
        o."UserID",
        o."Date",
        o."Shipping",
        o."Status",
        o."Payment",
        o."Name" AS "ReceiverName", 
        o."Phone",
        o."Address",
        o."Total",
        o."Request",
        json_agg(
          json_build_object(
            'OrderItemID', oi."OrderItemID",
            'Name', p."Name",
            'Color', pv."Color",
            'MainImage', pv."MainImage",
            'Quantity', oi."Quantity",
            'Price', oi."Price",
            'ProductType', p. "ProductType",
            'SubType', p. "SubType"
          )
        ) AS items
        FROM "order" o
        JOIN "order_items" oi ON o."OrderID" = oi."OrderID"
        JOIN "product_variants" pv ON oi."VariantID" = pv."VariantID"
        JOIN "product" p ON pv."ProductID" = p."ProductID"
        WHERE o."UserID" = ${currentUserId} AND o."Status" = ${status}
        GROUP BY o."OrderID"
        ORDER BY o."Date" DESC, o."OrderID" DESC
        LIMIT ${limit + 1}
        OFFSET ${offset};`;
    const hasNextPage = orders.length > limit;
    const data = hasNextPage ? orders.slice(0, limit) : orders;

    return res.status(200).json({
      success: true,
      page,
      limit,
      hasNextPage,
      nextPage: hasNextPage ? page + 1 : null,
      length: data.length,
      data,
    });
  } catch (error) {
    console.error("Error fetching user orders:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};
const cancelOrder = async (req, res) => {
  try {
    const userID = req.userId; // Lấy từ token đăng nhập
    const { orderID } = req.body; // Hoặc req.body tùy cách bạn thiết kế route
    const result = await sql`
      UPDATE "order"
      SET "Status" = 'Canceled'
      WHERE "OrderID" = ${orderID} 
        AND "UserID" = ${userID} 
        AND "Status" = 'Pending'
      RETURNING "OrderID";
    `;
    console.log(result);
    if (result.rowCount === 0) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot cancel this order. The order does not exist or has already passed the pending stage.",
      });
    }

    const orderItems = await sql`
      SELECT "VariantID", "Quantity"
      FROM "order_items"
      WHERE "OrderID" = ${orderID};
    `;

    for (const item of orderItems) {
      await sql`
        UPDATE "product_variants"
        SET "Stock" = "Stock" + ${item.Quantity}
        WHERE "VariantID" = ${item.VariantID};
      `;
    }

    return res.status(200).json({
      success: true,
      message: "Successfully canceled the order!",
    });
  } catch (error) {
    console.error("Error canceling order:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

const getAdminOrders = async (req, res) => {
  try {
    const status = req.query.status;
    const orders = await sql`
      SELECT 
        o."OrderID",
        o."UserID",
        o."Date",
        o."Shipping",
        o."Status",
        o."Payment",
        o."Name" AS "ReceiverName", 
        o."Phone",
        o."Address",
        o."Total",
        o."Request",
        json_agg(
          json_build_object(
            'OrderItemID', oi."OrderItemID",
            'Name', p."Name",
            'Color', pv."Color",
            'MainImage', pv."MainImage",
            'Quantity', oi."Quantity",
            'Price', oi."Price" 
          )
        ) AS items
        FROM "order" o
        JOIN "order_items" oi ON o."OrderID" = oi."OrderID"
        JOIN "product_variants" pv ON oi."VariantID" = pv."VariantID"
        JOIN "product" p ON pv."ProductID" = p."ProductID"
        WHERE o."Status" = ${status}
        GROUP BY o."OrderID"
        ORDER BY o."Date" DESC;`;
    return res.status(200).json({
      success: true,
      length: orders ? orders.length : 0,
      data: orders,
    });
  } catch (error) {
    console.log(error);
  }
};

const cancelAdminOrder = async (req, res) => {
  try {
    const { orderID } = req.body;

    const result = await sql`
      UPDATE "order"
      SET "Status" = 'Canceled'
      WHERE "OrderID" = ${orderID} 
        AND "Status" = 'Pending'
      RETURNING "OrderID";
    `;
    console.log(result);
    if (result.rowCount === 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel order!",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Canceled order!",
    });
  } catch (error) {
    console.error("Error when cancel order:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

const proceedAdminOrder = async (req, res) => {
  try {
    const { orderID } = req.body;

    const result = await sql`
      UPDATE "order"
      SET "Status" = 'Delivered'
      WHERE "OrderID" = ${orderID} 
        AND "Status" = 'Pending'
      RETURNING "OrderID";
    `;
    console.log(result);
    if (result.rowCount === 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot Proceed order!",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Order Proceeded!",
    });
  } catch (error) {
    console.error("Error when proceed order :", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

const prepareOrder = async (req, res) => {
  try {
    const { items } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No items provided for checkout" });
    }

    // Lấy ra danh sách các VariantID để query
    const variantIds = items.map((item) => item.id);

    // Truy vấn thông tin sản phẩm và biến thể dựa trên schema
    const dbVariants = await sql`
      SELECT 
        pv."VariantID", pv."MainImage", pv."Price", pv."Color", pv."Stock",
        p."Name", p."ProductType", p."SubType"
      FROM "product_variants" pv
      JOIN "product" p ON pv."ProductID" = p."ProductID"
      WHERE pv."VariantID" = ANY(${variantIds}::int[])
    `;

    let warnings = 0;
    let totalQuantity = 0;
    let subTotal = 0;
    const validItems = [];

    // Duyệt qua từng item frontend gửi lên để đối chiếu với dữ liệu Database
    for (const reqItem of items) {
      // Tìm sản phẩm tương ứng trong kết quả Database trả về
      const dbItem = dbVariants.find((v) => v.VariantID === reqItem.id);

      if (!dbItem) {
        warnings += 1;
        continue;
      }

      // Logic kiểm tra Stock
      if (dbItem.Stock === 0) {
        // Nếu stock = 0, tăng biến cảnh báo và KHÔNG push vào mảng validItems
        warnings += 1;
        continue;
      }

      let finalQuantity = reqItem.qty;

      if (finalQuantity > dbItem.Stock) {
        // Nếu số lượng đặt lớn hơn stock hiện có, ép số lượng về bằng stock
        finalQuantity = dbItem.Stock;
        warnings += 1;

        await sql`
          UPDATE "cart_items" AS ci
          SET "Quantity" = ${finalQuantity}
          FROM "cart" AS c
          WHERE ci."CartID" = c."CartID"
            AND c."UserID" = ${req.userId}
            AND ci."VariantID" = ${dbItem.VariantID}
            AND ci."Quantity" > ${dbItem.Stock}
        `;
      }

      // Đẩy sản phẩm hợp lệ vào danh sách trả về cho màn hình Checkout
      validItems.push({
        VariantID: dbItem.VariantID,
        Name: dbItem.Name,
        ProductType: dbItem.ProductType,
        SubType: dbItem.SubType,
        Color: dbItem.Color,
        MainImage: dbItem.MainImage,
        Price: dbItem.Price,
        Quantity: finalQuantity, // Sử dụng số lượng đã được xử lý an toàn
      });

      // Cộng dồn tổng số lượng và tạm tính
      totalQuantity += finalQuantity;
      subTotal += Number(dbItem.Price) * finalQuantity;
    }

    let finalMessage = "Prepare order success";
    if (warnings > 0) {
      finalMessage =
        "Some selected items were removed or their quantities were adjusted due to stock changes.";
    }
    res.status(200).json({
      success: true,
      message: finalMessage,
      warnings,
      totalQuantity,
      subTotal,
      items: validItems,
    });
  } catch (error) {
    console.error("Prepare order error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
module.exports = {
  getOrders,
  cancelOrder,
  getAdminOrders,
  cancelAdminOrder,
  proceedAdminOrder,
  prepareOrder,
};
