import {
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  varchar,
  decimal,
  boolean,
  json,
  index,
  serial,
} from "drizzle-orm/pg-core";

// ─── Enums ────────────────────────────────────────────────────────────────────
export const roleEnum = pgEnum("role", ["user", "admin"]);
export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "payment_confirmed",
  "processing",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "refunded",
]);
export const paymentMethodEnum = pgEnum("payment_method", ["mpesa", "paypal", "stripe", "card", "cod"]);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "paid", "failed", "refunded", "completed"]);
export const aiRoleEnum = pgEnum("ai_role", ["user", "assistant"]);
export const messageTypeEnum = pgEnum("message_type", ["chat", "product_recommendation", "order_tracking", "admin_query"]);
export const payoutStatusEnum = pgEnum("payout_status", ["pending", "completed", "failed"]);

// ─── Users ────────────────────────────────────────────────────────────────────
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: varchar("name", { length: 256 }),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 32 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  password: varchar("password", { length: 256 }),
  role: roleEnum("role").default("user").notNull(),
  emailVerified: boolean("emailVerified").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => new Date()).notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
}, (table) => ({
  emailIdx: index("users_email_idx").on(table.email),
  nameIdx: index("users_name_idx").on(table.name),
  phoneIdx: index("users_phone_idx").on(table.phone),
}));

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Categories ───────────────────────────────────────────────────────────────
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  parentId: integer("parentId"),
  name: varchar("name", { length: 128 }).notNull(),
  slug: varchar("slug", { length: 128 }).notNull().unique(),
  description: text("description"),
  imageUrl: text("imageUrl"),
  icon: varchar("icon", { length: 64 }),
  featured: boolean("featured").default(false).notNull(),
  active: boolean("active").default(true).notNull(),
  order: integer("order").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  activeIdx: index("categories_active_idx").on(table.active),
  slugIdx: index("categories_slug_idx").on(table.slug),
  parentIdIdx: index("categories_parent_id_idx").on(table.parentId),
}));

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

// ─── Products ─────────────────────────────────────────────────────────────────
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  categoryId: integer("categoryId").notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  slug: varchar("slug", { length: 256 }).notNull().unique(),
  description: text("description"),
  shortDescription: text("shortDescription"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  comparePrice: decimal("comparePrice", { precision: 10, scale: 2 }),
  stock: integer("stock").default(0).notNull(),
  brand: varchar("brand", { length: 128 }),
  sku: varchar("sku", { length: 128 }),
  images: json("images").$type<string[]>(),
  specifications: json("specifications").$type<Record<string, string>>(),
  tags: json("tags").$type<string[]>(),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0"),
  reviewCount: integer("reviewCount").default(0),
  featured: boolean("featured").default(false),
  active: boolean("active").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => new Date()).notNull(),
}, (table) => ({
  nameIdx: index("products_name_idx").on(table.name),
  brandIdx: index("products_brand_idx").on(table.brand),
  skuIdx: index("products_sku_idx").on(table.sku),
  activeIdx: index("products_active_idx").on(table.active),
  categoryIdIdx: index("products_category_id_idx").on(table.categoryId),
  createdAtIdx: index("products_created_at_idx").on(table.createdAt),
  featuredIdx: index("products_featured_idx").on(table.featured),
}));

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

// ─── Addresses ────────────────────────────────────────────────────────────────
export const addresses = pgTable("addresses", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  fullName: varchar("fullName", { length: 256 }).notNull(),
  phone: varchar("phone", { length: 32 }).notNull(),
  addressLine: text("addressLine").notNull(),
  city: varchar("city", { length: 128 }).notNull(),
  postalCode: varchar("postalCode", { length: 32 }),
  country: varchar("country", { length: 128 }).notNull(),
  isDefault: boolean("isDefault").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Address = typeof addresses.$inferSelect;
export type InsertAddress = typeof addresses.$inferInsert;

// ─── Cart Items ───────────────────────────────────────────────────────────────
export const cartItems = pgTable("cart_items", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  productId: integer("productId").notNull(),
  quantity: integer("quantity").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => new Date()).notNull(),
}, (table) => ({
  userIdIdx: index("cart_items_user_id_idx").on(table.userId),
  productIdIdx: index("cart_items_product_id_idx").on(table.productId),
}));

export type CartItem = typeof cartItems.$inferSelect;
export type InsertCartItem = typeof cartItems.$inferInsert;

// ─── Orders ───────────────────────────────────────────────────────────────────
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderNumber: varchar("orderNumber", { length: 64 }).notNull().unique(),
  userId: integer("userId"),
  status: orderStatusEnum("status").default("pending").notNull(),
  // Shipping snapshot
  shippingFullName: varchar("shippingFullName", { length: 256 }).notNull(),
  shippingEmail: varchar("shippingEmail", { length: 320 }),
  shippingPhone: varchar("shippingPhone", { length: 32 }).notNull(),
  shippingAddress: text("shippingAddress").notNull(),
  shippingCity: varchar("shippingCity", { length: 128 }).notNull(),
  shippingCounty: varchar("shippingCounty", { length: 128 }),
  shippingPostalCode: varchar("shippingPostalCode", { length: 32 }),
  shippingCountry: varchar("shippingCountry", { length: 128 }).notNull(),
  // Financials
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  shippingCost: decimal("shippingCost", { precision: 10, scale: 2 }).default("0").notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  // Payment
  paymentMethod: paymentMethodEnum("paymentMethod"),
  paymentStatus: paymentStatusEnum("paymentStatus").default("pending").notNull(),
  paymentReference: varchar("paymentReference", { length: 256 }),
  // Tracking
  trackingNumber: varchar("trackingNumber", { length: 128 }),
  estimatedDelivery: timestamp("estimatedDelivery"),
  notes: text("notes"),
  abandonedEmailSent: boolean("abandonedEmailSent").default(false).notNull(),
  deliveryAgentId: integer("delivery_agent_id"),
  deliveryOtp: varchar("delivery_otp", { length: 10 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => new Date()).notNull(),
}, (table) => ({
  userIdIdx: index("orders_user_id_idx").on(table.userId),
  statusIdx: index("orders_status_idx").on(table.status),
  createdAtIdx: index("orders_created_at_idx").on(table.createdAt),
  orderNumberIdx: index("orders_order_number_idx").on(table.orderNumber),
}));

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

// ─── Order Items ──────────────────────────────────────────────────────────────
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("orderId").notNull(),
  productId: integer("productId").notNull(),
  productName: varchar("productName", { length: 256 }).notNull(),
  productImage: text("productImage"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  quantity: integer("quantity").notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
}, (table) => ({
  orderIdIdx: index("order_items_order_id_idx").on(table.orderId),
}));

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = typeof orderItems.$inferInsert;

// ─── Wishlists ────────────────────────────────────────────────────────────────
export const wishlists = pgTable("wishlists", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  productId: integer("productId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("wishlists_user_id_idx").on(table.userId),
  productIdIdx: index("wishlists_product_id_idx").on(table.productId),
}));

export type Wishlist = typeof wishlists.$inferSelect;

// ─── Order Status History ─────────────────────────────────────────────────────
export const orderStatusHistory = pgTable("order_status_history", {
  id: serial("id").primaryKey(),
  orderId: integer("orderId").notNull(),
  status: varchar("status", { length: 64 }).notNull(),
  note: text("note"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OrderStatusHistory = typeof orderStatusHistory.$inferSelect;

// ─── Payments ─────────────────────────────────────────────────────────────────
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  orderId: integer("orderId").notNull(),
  method: paymentMethodEnum("method").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 8 }).default("USD").notNull(),
  status: paymentStatusEnum("status").default("pending").notNull(),
  transactionId: varchar("transactionId", { length: 256 }),
  providerResponse: json("providerResponse"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => new Date()).notNull(),
}, (table) => ({
  orderIdIdx: index("payments_order_id_idx").on(table.orderId),
  transactionIdIdx: index("payments_transaction_id_idx").on(table.transactionId),
}));

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

// ─── Product Reviews ──────────────────────────────────────────────────────────
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  productId: integer("productId").notNull(),
  userId: integer("userId").notNull(),
  rating: integer("rating").notNull(),
  title: varchar("title", { length: 256 }),
  body: text("body"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  productIdIdx: index("reviews_product_id_idx").on(table.productId),
  userIdIdx: index("reviews_user_id_idx").on(table.userId),
}));

export type Review = typeof reviews.$inferSelect;

// ─── Analytics ────────────────────────────────────────────────────────────────
export const pageViews = pgTable("page_views", {
  id: serial("id").primaryKey(),
  path: varchar("path", { length: 256 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  createdAtIdx: index("page_views_created_at_idx").on(table.createdAt),
}));

export type PageView = typeof pageViews.$inferSelect;

// ─── Settings ─────────────────────────────────────────────────────────────────
export const settings = pgTable("settings", {
  key: varchar("key", { length: 64 }).primaryKey(),
  value: json("value").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => new Date()).notNull(),
});

export type Setting = typeof settings.$inferSelect;

// ─── Content ──────────────────────────────────────────────────────────────────
export const banners = pgTable("banners", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 256 }).notNull(),
  description: text("description"),
  image: text("image").notNull(),
  active: boolean("active").default(true).notNull(),
  order: integer("order").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => new Date()).notNull(),
});

export type Banner = typeof banners.$inferSelect;

export const promotions = pgTable("promotions", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 256 }).notNull(),
  description: text("description").notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => new Date()).notNull(),
});

export const announcements = pgTable("announcements", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 256 }).notNull(),
  content: text("content").notNull(),
  date: timestamp("date").notNull(),
  active: boolean("active").default(true).notNull(),
  image: text("image"),
  linkUrl: varchar("linkUrl", { length: 512 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => new Date()).notNull(),
});

// ─── Delivery Agents ──────────────────────────────────────────────────────────
export const deliveryAgents = pgTable("delivery_agents", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  vehicleNumber: varchar("vehicle_number", { length: 50 }).notNull(),
  vehicleType: varchar("vehicle_type", { length: 50 }).default("bike"),
  isAvailable: boolean("is_available").default(true),
  pin: varchar("pin", { length: 256 }).notNull(),
});

export type DeliveryAgent = typeof deliveryAgents.$inferSelect;
export type InsertDeliveryAgent = typeof deliveryAgents.$inferInsert;

// ─── Delivery Payouts ───────────────────────────────────────────────────────
export const deliveryPayouts = pgTable('delivery_payouts', {
  id: serial('id').primaryKey(),
  agentId: integer('agent_id').notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  status: payoutStatusEnum('status').default('pending').notNull(),
  requestedAt: timestamp('requested_at').defaultNow().notNull(),
  processedAt: timestamp('processed_at'),
  transactionId: varchar('transaction_id', { length: 255 }),
  notes: varchar('notes', { length: 255 }),
  mpesaConversationId: varchar('mpesa_conversation_id', { length: 255 }),
  mpesaOriginatorConversationId: varchar('mpesa_originator_conversation_id', { length: 255 }),
});

export type DeliveryPayout = typeof deliveryPayouts.$inferSelect;
export type InsertDeliveryPayout = typeof deliveryPayouts.$inferInsert;

// ─── Product Views (Personalization) ───────────────────────────────────────────
export const productViews = pgTable("product_views", {
  id: serial("id").primaryKey(),
  userId: integer("userId"),
  sessionId: varchar("sessionId", { length: 128 }),
  productId: integer("productId").notNull(),
  viewedAt: timestamp("viewedAt").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("product_views_user_id_idx").on(table.userId),
  productIdIdx: index("product_views_product_id_idx").on(table.productId),
  viewedAtIdx: index("product_views_viewed_at_idx").on(table.viewedAt),
}));

export type ProductView = typeof productViews.$inferSelect;
export type InsertProductView = typeof productViews.$inferInsert;

// ─── AI Conversations (Analytics) ──────────────────────────────────────────────
export const aiConversations = pgTable("ai_conversations", {
  id: serial("id").primaryKey(),
  userId: integer("userId"),
  userEmail: varchar("userEmail", { length: 320 }),
  role: aiRoleEnum("role").notNull(),
  message: text("message").notNull(),
  messageType: messageTypeEnum("messageType").default("chat").notNull(),
  sentiment: varchar("sentiment", { length: 32 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("ai_conversations_user_id_idx").on(table.userId),
  createdAtIdx: index("ai_conversations_created_at_idx").on(table.createdAt),
  messageTypeIdx: index("ai_conversations_message_type_idx").on(table.messageType),
}));

export type AIConversation = typeof aiConversations.$inferSelect;
export type InsertAIConversation = typeof aiConversations.$inferInsert;

// ─── User Preferences (Personalization) ─────────────────────────────────────────
export const userPreferences = pgTable("user_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().unique(),
  preferredBrands: json("preferredBrands").$type<string[]>().default([]),
  preferredCategories: json("preferredCategories").$type<number[]>().default([]),
  budgetMin: decimal("budgetMin", { precision: 10, scale: 2 }),
  budgetMax: decimal("budgetMax", { precision: 10, scale: 2 }),
  viewCount: integer("viewCount").default(0),
  purchaseCount: integer("purchaseCount").default(0),
  lastInteractionAt: timestamp("lastInteractionAt"),
  customerSegment: varchar("customerSegment", { length: 64 }),
  updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => new Date()).notNull(),
}, (table) => ({
  userIdIdx: index("user_preferences_user_id_idx").on(table.userId),
}));

export type UserPreference = typeof userPreferences.$inferSelect;
export type InsertUserPreference = typeof userPreferences.$inferInsert;

// ─── Product Price History (Dynamic Pricing) ──────────────────────────────────
export const productPriceHistory = pgTable("product_price_history", {
  id: serial("id").primaryKey(),
  productId: integer("productId").notNull(),
  oldPrice: decimal("oldPrice", { precision: 10, scale: 2 }).notNull(),
  newPrice: decimal("newPrice", { precision: 10, scale: 2 }).notNull(),
  reason: varchar("reason", { length: 256 }),
  sales7d: integer("sales7d").default(0),
  demand: varchar("demand", { length: 64 }),
  changedAt: timestamp("changedAt").defaultNow().notNull(),
}, (table) => ({
  productIdIdx: index("product_price_history_product_id_idx").on(table.productId),
  changedAtIdx: index("product_price_history_changed_at_idx").on(table.changedAt),
}));

export type ProductPriceHistory = typeof productPriceHistory.$inferSelect;
export type InsertProductPriceHistory = typeof productPriceHistory.$inferInsert;
