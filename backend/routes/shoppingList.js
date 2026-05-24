const express = require("express");
const {
  getShoppingList,
  addShoppingItem,
  toggleShoppingItem,
  deleteShoppingItem,
  clearPurchasedItems,
} = require("../controllers/shoppingListController");
const requireAuth = require("../middleware/requireAuth");

const router = express.Router();
router.use(requireAuth);

// GET all items
router.get("/", getShoppingList);

// POST add item
router.post("/", addShoppingItem);

// PATCH toggle purchased
router.patch("/:id/toggle", toggleShoppingItem);

// DELETE single item
router.delete("/clear-purchased", clearPurchasedItems);
router.delete("/:id", deleteShoppingItem);

module.exports = router;
