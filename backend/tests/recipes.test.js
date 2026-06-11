const request = require("supertest");
const { Op } = require("sequelize");
const app = require("../server");
const { connectToDb, closeDb } = require("../utils/database");
const { Recipe, User } = require("../models");

jest.setTimeout(30000);

const testEmail = "recipeuser@example.com";
const testRecipeTitles = ["Tomato Egg Stir Fry", "Chicken Salad"];

beforeAll(async () => {
  await connectToDb();
});

afterAll(async () => {
  await closeDb();
});

let token;

beforeEach(async () => {
  await Recipe.destroy({ where: { title: { [Op.in]: testRecipeTitles } } });
  await User.destroy({ where: { email: testEmail } });

  await request(app).post("/api/auth/signup").send({
    email: testEmail,
    password: "password",
  });

  const response = await request(app).post("/api/auth/login").send({
    email: testEmail,
    password: "password",
  });

  token = response.body.token;

  await Recipe.bulkCreate([
    {
      title: "Tomato Egg Stir Fry",
      instructions: "Cook tomatoes with eggs.",
      ingredients: [
        { name: "Ca chua", quantity: "2", unit: "qua" },
        { name: "Trung ga", quantity: "2", unit: "qua" },
      ],
      created_by_name: "Recipe Test",
    },
    {
      title: "Chicken Salad",
      instructions: "Mix chicken with vegetables.",
      ingredients: [
        { name: "Thit ga", quantity: "300", unit: "gram" },
        { name: "Xa lach", quantity: "1", unit: "bo" },
      ],
      created_by_name: "Recipe Test",
    },
  ]);
});

afterEach(async () => {
  await Recipe.destroy({ where: { title: { [Op.in]: testRecipeTitles } } });
  await User.destroy({ where: { email: testEmail } });
});

describe("Recipe suggestion route", () => {
  test("should reject unauthenticated suggestion requests", async () => {
    const response = await request(app)
      .post("/api/recipes/suggest")
      .send({ ingredients: ["Ca chua"] });

    expect(response.status).toBe(401);
  });

  test("should validate ingredients payload", async () => {
    const response = await request(app)
      .post("/api/recipes/suggest")
      .set("Authorization", `Bearer ${token}`)
      .send({ ingredients: "Ca chua" });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error");
  });

  test("should return dishes ranked by available ingredients", async () => {
    const response = await request(app)
      .post("/api/recipes/suggest")
      .set("Authorization", `Bearer ${token}`)
      .send({
        ingredients: [
          { name: "Ca chua bi" },
          { name: "Trung ga" },
        ],
      });

    expect(response.status).toBe(200);
    expect(response.body.ingredients).toEqual(["Ca chua bi", "Trung ga"]);
    expect(response.body.dishes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: "Tomato Egg Stir Fry",
          matchScore: 1,
          canCook: true,
          matchedIngredients: expect.arrayContaining(["Ca chua", "Trung ga"]),
          missingIngredients: [],
        }),
      ]),
    );
  });
});
