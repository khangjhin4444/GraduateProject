const { neon } = require("@neondatabase/serverless");
const sql = neon(process.env.DATABASE_URL);

const changeProfile = async (req, res) => {
  try {
    const userID = req.userId;
    const { address, name, phone } = req.body;
    if (!address | !name | !phone) {
      res.status(400).json({
        success: false,
        message: "Not enough information",
      });
    }
    await sql`UPDATE "user" 
                          SET "Name" = ${name}, "Address" = ${address}, "Phone" = ${phone}
                          WHERE "UserID" = ${userID};`;
    return res.status(200).json({
      success: true,
      message: "Updated User information",
    });
  } catch (error) {
    console.log(error);
    throw error;
  }
};

const getUserInfo = async (req, res) => {
  try {
    const userID = req.userId;
    const user =
      await sql`SELECT u."Name", u."Username", u."Address", u."Phone", c."CartID" FROM "user" u LEFT JOIN "cart" c ON u."UserID" = c."UserID" WHERE u."UserID" = ${userID};`;
    const role = user[0].Username === "admin" ? "admin" : "user";
    const cartQuantity =
      await sql`SELECT COALESCE(SUM("Quantity"), 0) AS "TotalQuantity"
                            FROM "cart_items"
                            WHERE "CartID" = ${user[0].CartID};`;
    if (user.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    return res.status(200).json({
      success: true,
      data: {
        Name: user[0].Name,
        Address: user[0].Address,
        Phone: user[0].Phone,
        cartQuantity: cartQuantity[0].TotalQuantity,
        role: role,
      },
    });
  } catch (error) {
    console.log(error);
    throw error;
  }
};

module.exports = { changeProfile, getUserInfo };
