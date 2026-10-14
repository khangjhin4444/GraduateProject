CREATE TYPE shipping_type AS ENUM ('Normal', 'Fast');
CREATE TYPE status_type AS ENUM ('Pending', 'Delivered', 'Declined', 'Canceled', 'Confirmed');
CREATE TYPE payment_type AS ENUM ('COD', 'Banking');
CREATE TYPE product_type AS ENUM ('Prebuild', 'KeyboardKit', 'Keycap', 'Switch');
CREATE TYPE sub_type AS ENUM ('75%', 'Full Size', 'TKL', 'Alice', 'Cherry', 'MDA', 'Artisan', 'SA', 'Clicky', 'Tactile', 'Linear', 'Silent');


CREATE TABLE "user" (
    "UserID" SERIAL PRIMARY KEY,
    "Name" VARCHAR(50) NOT NULL,
    "Address" JSONB,
    "Phone" VARCHAR(20),
    "Username" VARCHAR(50),
    "Password" TEXT
);


CREATE TABLE "product" (
    "ProductID" SERIAL PRIMARY KEY,
    "Name" VARCHAR(120),
    "ProductType" product_type,
    "SubType" sub_type,
    "Description" JSONB
);


CREATE TABLE "product_images" (
    "ImageID" SERIAL PRIMARY KEY,
    "ProductID" INTEGER NOT NULL,
    "ImageUrl" TEXT NOT NULL
);


CREATE TABLE "product_variants" (
    "VariantID" SERIAL PRIMARY KEY,
    "ProductID" INTEGER NOT NULL,
    "Color" VARCHAR(20) NOT NULL,
    "Price" NUMERIC NOT NULL,
    "Stock" INTEGER DEFAULT 0,
    "MainImage" VARCHAR NOT NULL
);


CREATE TABLE "cart" (
    "CartID" SERIAL PRIMARY KEY,
    "UserID" INTEGER NOT NULL
);


CREATE TABLE "cart_items" (
    "CartItemID" SERIAL PRIMARY KEY,
    "CartID" INTEGER NOT NULL,
    "VariantID" INTEGER NOT NULL,
    "Quantity" INTEGER NOT NULL
);


CREATE TABLE "order" (
    "OrderID" SERIAL PRIMARY KEY,
    "UserID" INTEGER NOT NULL,
    "Date" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    "Shipping" shipping_type NOT NULL,
    "Status" status_type NOT NULL,
    "Payment" payment_type NOT NULL,
    "Name" VARCHAR(30) NOT NULL,
    "Phone" VARCHAR(20) NOT NULL,
    "Address" VARCHAR(200) NOT NULL,
    "Total" NUMERIC,
    "Request" TEXT
);


CREATE TABLE "order_items" (
    "OrderItemID" SERIAL PRIMARY KEY,
    "OrderID" INTEGER NOT NULL,
    "VariantID" INTEGER NOT NULL,
    "Quantity" INTEGER NOT NULL,
    "Price" NUMERIC NOT NULL
);


CREATE TABLE "refresh_tokens" (
    "id" SERIAL PRIMARY KEY,
    "user_id" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);


CREATE TABLE "refresh_token_replays" (
    "Token" TEXT NOT NULL,
    "AccessToken" TEXT NOT NULL,
    "RefreshToken" TEXT NOT NULL,
    "UserData" JSONB NOT NULL,
    "RemainingSessionMs" BIGINT NOT NULL,
    "ExpiresAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL
);