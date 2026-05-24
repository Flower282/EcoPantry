const { connectToDb } = require("./utils/database");
const db = require("./models");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
require("dotenv").config();

async function seed() {
  try {
    console.log("Connecting to Database...");
    await connectToDb();
    console.log("Syncing Database...");
    await db.sequelize.sync({ alter: true }); // Ensure columns like category, emoji are added

    console.log("Creating/Finding test user...");
    const email = "test@example.com";
    let user = await db.User.findOne({ where: { email } });
    
    if (!user) {
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash("password123", salt);
      user = await db.User.create({
        name: "Test User",
        email,
        password_hash,
        dietary_preferences: "Ăn chay, Không ăn cay",
        ingredients: [
          {
            id: `item_${Date.now()}_1`,
            name: "Cà chua bi",
            category: "Rau củ",
            quantity: "500",
            unit: "gram",
            emoji: "🍅",
            storage: "cold",
            daysLeft: 5,
            expiryDate: new Date(Date.now() + 5 * 86400000).toLocaleDateString('vi-VN'),
            addedDate: new Date().toLocaleDateString('vi-VN'),
            status: "fresh"
          },
          {
            id: `item_${Date.now()}_2`,
            name: "Cá hồi phi lê",
            category: "Hải sản",
            quantity: "300",
            unit: "gram",
            emoji: "🐟",
            storage: "freezer",
            daysLeft: 14,
            expiryDate: new Date(Date.now() + 14 * 86400000).toLocaleDateString('vi-VN'),
            addedDate: new Date().toLocaleDateString('vi-VN'),
            status: "fresh"
          },
          {
            id: `item_${Date.now()}_3`,
            name: "Sữa tươi không đường",
            category: "Sữa & trứng",
            quantity: "1",
            unit: "lít",
            emoji: "🥛",
            storage: "cold",
            daysLeft: 2,
            expiryDate: new Date(Date.now() + 2 * 86400000).toLocaleDateString('vi-VN'),
            addedDate: new Date().toLocaleDateString('vi-VN'),
            status: "expiring"
          }
        ]
      });
      console.log("Created user test@example.com");
    } else {
      console.log("User already exists, updating ingredients...");
      user.ingredients = [
        {
          id: `item_${Date.now()}_1`,
          name: "Cà chua bi",
          category: "Rau củ",
          quantity: "500",
          unit: "gram",
          emoji: "🍅",
          storage: "cold",
          daysLeft: 5,
          expiryDate: new Date(Date.now() + 5 * 86400000).toLocaleDateString('vi-VN'),
          addedDate: new Date().toLocaleDateString('vi-VN'),
          status: "fresh"
        },
        {
          id: `item_${Date.now()}_2`,
          name: "Cá hồi phi lê",
          category: "Hải sản",
          quantity: "300",
          unit: "gram",
          emoji: "🐟",
          storage: "freezer",
          daysLeft: 14,
          expiryDate: new Date(Date.now() + 14 * 86400000).toLocaleDateString('vi-VN'),
          addedDate: new Date().toLocaleDateString('vi-VN'),
          status: "fresh"
        },
        {
          id: `item_${Date.now()}_3`,
          name: "Sữa tươi không đường",
          category: "Sữa & trứng",
          quantity: "1",
          unit: "lít",
          emoji: "🥛",
          storage: "cold",
          daysLeft: 2,
          expiryDate: new Date(Date.now() + 2 * 86400000).toLocaleDateString('vi-VN'),
          addedDate: new Date().toLocaleDateString('vi-VN'),
          status: "expiring"
        }
      ];
      await user.save();
    }

    console.log("Setting up group...");
    let membership = await db.GroupMember.findOne({ where: { user_id: user.id } });
    let group_id;
    if (!membership) {
      const group = await db.Group.create({
        group_name: "Gia đình của tôi",
        invite_code: uuidv4().slice(0, 8).toUpperCase(),
      });
      await db.GroupMember.create({ user_id: user.id, group_id: group.id });
      group_id = group.id;
    } else {
      group_id = membership.group_id;
    }

    console.log("Seeding Shopping List...");
    await db.ShoppingList.destroy({ where: { group_id } });
    await db.ShoppingList.bulkCreate([
      { group_id, item_name: "Bánh tráng", quantity: 1, unit: "gói", is_purchased: false, category: "Thực phẩm khô", emoji: "🍚", updated_by: user.id },
      { group_id, item_name: "Khoai tây", quantity: 500, unit: "gram", is_purchased: false, category: "Rau củ", emoji: "🥔", updated_by: user.id },
      { group_id, item_name: "Nước mắm", quantity: 1, unit: "chai", is_purchased: true, category: "Gia vị", emoji: "🧴", updated_by: user.id },
    ]);

    console.log("Seeding Recipes...");
    // Just add one if empty or just bulk add to ensure we have data
    const existingRecipes = await db.Recipe.count();
    if (existingRecipes < 3) {
      await db.Recipe.bulkCreate([
        {
          title: "Canh chua cá hồi",
          instructions: "1. Làm sạch cá.\n2. Cắt cà chua.\n3. Đun nước sôi, bỏ cá và cà chua vào.\n4. Nêm nếm vừa ăn.",
          image_url: "https://images.unsplash.com/photo-1680084570772-1da0c78362a4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
          ingredients: [
            { name: "Cá hồi phi lê", quantity: "300", unit: "gram" },
            { name: "Cà chua", quantity: "2", unit: "quả" },
            { name: "Nước mắm", quantity: "2", unit: "thìa" }
          ],
          user_uuid: user.id,
          created_by_name: "Test User"
        },
        {
          title: "Gà xào sả ớt",
          instructions: "1. Cắt gà vừa ăn.\n2. Băm sả và ớt.\n3. Xào gà với sả ớt đến khi chín.",
          image_url: "https://images.unsplash.com/photo-1614955177711-2540ad25432b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
          ingredients: [
            { name: "Thịt gà", quantity: "500", unit: "gram" },
            { name: "Sả", quantity: "3", unit: "nhánh" },
            { name: "Ớt", quantity: "2", unit: "quả" }
          ],
          user_uuid: user.id,
          created_by_name: "Test User"
        }
      ]);
    }

    console.log("Seeding complete! You can login with test@example.com / password123");
    process.exit(0);
  } catch (err) {
    console.error("Error during seeding:", err);
    process.exit(1);
  }
}

seed();
