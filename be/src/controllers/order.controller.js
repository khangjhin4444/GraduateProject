const { neon } = require("@neondatabase/serverless");
const sql = neon(process.env.DATABASE_URL);

const getOrders = async (req, res) => {
  try {
    const currentUserId = req.userId;
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
        WHERE o."UserID" = ${currentUserId} AND o."Status" = ${status}
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
    return res.status(500).json({ success: false, message: "Server error." });
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
    return res.status(500).json({ success: false, message: "Server Error." });
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
    return res.status(500).json({ success: false, message: "Server Error." });
  }
};
module.exports = {
  getOrders,
  cancelOrder,
  getAdminOrders,
  cancelAdminOrder,
  proceedAdminOrder,
};
