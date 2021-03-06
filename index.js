const express = require("express");
const app = express();
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
// ---------------------------

// error solved
// error
// JWT ইউজ করার পরে http://localhost:5000/ দিয়ে সবকিছু কাজ করতেছে, কিন্তু heruku তে  push করার পরে heruku এর লিঙ্ক দিলে এই error দেখাচ্ছে এবং সার্ভার ক্রাশ করতেছে এবং এর কারনে আর কোন কিছু লোড হচ্ছে না।

// solution
// environment variable গুলো heroku তে ঠিক করে অ্যাড করতে ভুল হয়েছিল।

// JWT  token verify
function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "unauthorized access" });
  }
  const token = authHeader.split(" ")[1];
  // verify a token symmetric
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).send({ message: "Forbidden access" });
    }
    console.log("decoded", decoded);
    req.decoded = decoded;
    next();
  });
}

// async await function
async function run() {
  const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_KEY}@cluster0.hmt2r.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
  const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverApi: ServerApiVersion.v1,
  });

  // try catch finally
  try {
    await client.connect();
    const inventoryCollection = client.db("warehouse").collection("inventory");
    const categoriesCollection = client
      .db("warehouse")
      .collection("categories");
    const publicationsCollection = client
      .db("warehouse")
      .collection("publications");

    // heroku API
    // https://quiet-sierra-51150.herokuapp.com/

    // AUTH
    app.post("/login", async (req, res) => {
      const user = req.body;
      const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1d",
      });
      res.send({ accessToken });
    });

    // Get Method to read all items
    app.get("/inventory", async (req, res) => {
      const query = {};
      const cursor = inventoryCollection.find(query);
      const inventory = await cursor.toArray();
      res.send(inventory);
    });
    // -------------------------------------------

    // Get Method to read all categories
    app.get("/categories", async (req, res) => {
      const query = {};
      const cursor = categoriesCollection.find(query);
      const inventory = await cursor.toArray();
      res.send(inventory);
    });
    // -------------------------------------------

    // Get Method to read all publications
    app.get("/publications", async (req, res) => {
      const query = {};
      const cursor = publicationsCollection.find(query);
      const inventory = await cursor.toArray();
      res.send(inventory);
    });
    // -------------------------------------------

    // Get  AP to Read by ID
    // https://quiet-sierra-51150.herokuapp.com/inventory/${id}
    app.get("/inventory/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await inventoryCollection.findOne(query);
      res.send(result);
    });
    // -------------------------------------------

    //  Get  AP to Read by  Search query
    app.get("/my-items", verifyJWT, async (req, res) => {
      const decodedEmail = req.decoded.email;
      const email = req.query.email;
      if (email === decodedEmail) {
        const query = { email: email };
        const cursor = inventoryCollection.find(query);
        const result = await cursor.toArray();
        res.send(result);
      } else {
        res.status(403).send({ message: "Forbidden access" });
      }
    });

    // Create POST Method items api
    app.post("/inventory", async (req, res) => {
      const newInventory = req.body;
      const result = await inventoryCollection.insertOne(newInventory);
      console.log(`Inventory insert with id: ${result.insertedId}`);
      res.send({ result: "success" });
    });
    // --------------------------------------------------------

    //  Update Item Quantity data in db
    app.put("/inventory/:id", async (req, res) => {
      const id = req.params.id;
      const updateItem = req.body;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };

      const updateDoc = {
        $set: updateItem,
      };
      const result = await inventoryCollection.updateOne(
        filter,
        updateDoc,
        options
      );

      res.send(result);
    });
    // -------------------------------------------

    //  Delete inventory in db
    app.delete("/inventory/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await inventoryCollection.deleteOne(query);
      res.send(result);
    });
    // -------------------------------------------
  } finally {
  }
}

run().catch(console.dir);
// --------------------------------------------

app.get("/", (req, res) => {
  res.send("DB Books Warehouse Server Running");
});

app.listen(port, () => {
  console.log(`DB Books Warehouse Server port ${port}`);
});
