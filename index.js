const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
const stripe = require("stripe")(process.env.STRIPE_SECRET);

app.use(cors());
app.use(express.json());

//start

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.jtynkkk.mongodb.net/?retryWrites=true&w=majority`;
// console.log(uri);
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

//end

// const uri = process.env.DB_URI;
// const client = new MongoClient(uri, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
//   serverApi: ServerApiVersion.v1,
// });

function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "unauthorized access" });
  }

  const token = authHeader.split(" ")[1];

  jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "forbidden access" });
    }
    req.decoded = decoded;
    next();
  });
}

function run() {
  try {
    const categoryCollection = client.db("bikeValley").collection("categories");
    // const phonesCollection = client.db("cellSwap").collection("phones");
    const bikesCollection = client.db("bikeValley").collection("bikes");
    const usersCollection = client.db("bikeValley").collection("users");
    const bookingsCollection = client.db("bikeValley").collection("bookings");
    const adsCollection = client.db("bikeValley").collection("ads");
    const wishlistCollection = client.db("bikeValley").collection("wishlist");
    const paymentsCollection = client.db("bikeValley").collection("payments");

    app.get("/categories", async (req, res) => {
      const categories = await categoryCollection.find({}).toArray();
      res.send(categories);
    });

    app.get("/categories/:category", async (req, res) => {
      const query = { category: req.params.category };
      const singleCategory = await bikesCollection.find(query).toArray();
      res.send(singleCategory);
    });

    app.get("/phones", async (req, res) => {
      const query = {};
      const phones = await bikesCollection.find(query).toArray();
      res.send(phones);
    });

    // app.put("/update", async (req, res) => {
    //   const filter = { category: "Bazaz Bike" };
    //   const options = { upsert: true };
    //   const updateDoc = {
    //     $set: {
    //       category: "Bajaj",
    //     },
    //   };
    //   const result = await bikesCollection.updateMany(
    //     filter,
    //     updateDoc,
    //     options
    //   );
    //   res.send(result);
    // });

    app.get("/phones/categories/:category", async (req, res) => {
      const category = req.params.category;
      const query = { category: category };
      const phones = await bikesCollection.find(query).toArray();
      res.send(phones);
    });

    app.post("/phones", async (req, res) => {
      const phone = req.body;
      const result = await bikesCollection.insertOne(phone);
      res.send(result);
    });

    app.get("/phones/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const phone = await bikesCollection.findOne(query);
      res.send(phone);
    });

    app.get("/myPhones", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const phones = await bikesCollection.find(query).toArray();
      res.send(phones);
    });

    app.put("/users/:email", async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await usersCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.send(result);
    });

    app.get("/users", async (req, res) => {
      const user = await usersCollection.find({}).toArray();
      res.send(user);
    });

    app.get("/users/seller", async (req, res) => {
      const email = req.query.email;
      const user = await usersCollection.findOne({ email });
      if (user?.role === "Seller") {
        return res.send({ isSeller: user?.role === "Seller" });
      }
    });

    app.get("/users/buyer", async (req, res) => {
      const email = req.query.email;
      const user = await usersCollection.findOne({ email });
      if (user?.role === "Buyer") {
        return res.send({ isBuyer: user?.role === "Buyer" });
      }
    });

    app.get("/users/admin", async (req, res) => {
      const email = req.query.email;
      const user = await usersCollection.findOne({ email });
      if (user?.role === "Admin") {
        return res.send({ isAdmin: user?.role === "Admin" });
      } else {
        return res.send({ message: "You Are Not Admin" });
      }
    });

    app.get("/users/allsellers", async (req, res) => {
      const role = { role: "Seller" };
      const sellers = await usersCollection.find(role).toArray();
      res.send(sellers);
    });

    app.get("/users/allbuyers", verifyJWT, async (req, res) => {
      const decodedEmail = req.decoded.email;
      const email = req.query.email;
      if (email !== decodedEmail) {
        return res.status(403).send({ message: "forbidded access" });
      }

      const role = { role: "Buyer" };
      const buyers = await usersCollection.find(role).toArray();
      res.send(buyers);
    });

    app.delete("/users/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const user = await usersCollection.findOne(query);
      if (user.role === "Seller" || user.role === "Buyer") {
        const deleteUser = await usersCollection.deleteOne(query);
        return res.send(deleteUser);
      }
      return res.send({ message: "Not a Seller or Buyer" });
    });

    app.post("/bookings", async (req, res) => {
      const booking = req.body;
      const result = await bookingsCollection.insertOne(booking);
      res.send(result);
    });

    app.get("/myorders", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const orders = await bookingsCollection.find(query).toArray();
      res.send(orders);
    });
    app.get("/myorders/:id", async (req, res) => {
      const id = req.params.id;
      const query = { bookingId: id };
      const order = await bookingsCollection.findOne(query);
      res.send(order);
    });

    app.put("/wishlist", async (req, res) => {
      const id = req.query.id;
      const filter = { _id: ObjectId(id) };
      const phone = await bikesCollection.findOne(filter);
      const wishlistPhone = { ...phone, email: req.body.email };

      const options = { upsert: true };
      const updateDoc = {
        $set: wishlistPhone,
      };

      const result = await wishlistCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.send(result);
    });

    app.get("/wishlist", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const wishlist = await wishlistCollection.find(query).toArray();
      res.send(wishlist);
    });

    app.put("/ads", async (req, res) => {
      const phone = req.body;
      const id = req.query.id;
      const filter = { _id: id };
      const options = { upsert: true };
      const updateDoc = {
        $set: phone,
      };
      const result = await adsCollection.updateOne(filter, updateDoc, options);
      res.send(result);
    });

    app.get("/ads", verifyJWT, async (req, res) => {
      const email = req.query.email;
      const decodedEmail = req.decoded.email;
      if (email !== decodedEmail) {
        return res.status(403).send({ message: "forbidden access" });
      }

      const adsPhones = await adsCollection.find({}).toArray();
      res.send(adsPhones);
    });

    app.get("/jwt", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);

      if (user) {
        const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, {
          expiresIn: "3d",
        });
        return res.send({ accessToken: token });
      }
      res.status(403).send({ accessToken: "" });
    });

    app.put("/verifySeller", async (req, res) => {
      const email = req.query.email;
      const filter = { email: email };
      const user = await usersCollection.findOne(filter);

      if (user.role === "Seller") {
        const phones = await bikesCollection.find(filter).toArray();
        const updateDoc = {
          $set: {
            status: "verified",
          },
        };
        const sellerUpdate = await usersCollection.updateOne(filter, updateDoc);
        const phonesUpdate = await bikesCollection.updateMany(
          filter,
          updateDoc
        );

        res.json({ sellerUpdate, phonesUpdate });
      }
      // return res.send({message: 'This user is not seller'})
    });

    app.post("/create-payment-intent", async (req, res) => {
      const price = req.body.price;
      const amount = price * 100;
      const paymentIntent = await stripe.paymentIntents.create({
        currency: "usd",
        amount: amount,
        payment_method_types: ["card"],
      });
      res.send({ clientSecret: paymentIntent.client_secret });
    });

    app.post("/payments", async (req, res) => {
      const payment = req.body;
      const result = await paymentsCollection.insertOne(payment);
      const id = payment.bookingId;
      const filter = { _id: ObjectId(id) };
      const bookFilter = { bookingId: id };
      const adsFilter = { _id: id };
      // console.log(filter);
      const updatedDoc = {
        $set: {
          paid: true,
          transactionId: payment.transactionId,
        },
      };

      const updatedResult = await bookingsCollection.updateOne(
        bookFilter,
        updatedDoc
      );
      const phones = await bikesCollection.updateOne(filter, updatedDoc);
      const ads = await adsCollection.updateOne(adsFilter, updatedDoc);
      res.send(result);
    });
  } finally {
  }
}
run();

app.get("/", async (req, res) => {
  res.send("Bike Valley Server is Running");
});

app.listen(port, () => {
  console.log("App is Running Bike Valley on port 5000");
});
