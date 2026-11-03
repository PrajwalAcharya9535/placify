
require("dotenv").config();

const dns = require("node:dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const mongoose = require("mongoose");

async function main() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const indexes = await mongoose.connection.db
      .collection("placementapplications")
      .indexes();

    console.log(JSON.stringify(indexes, null, 2));
  } catch (error) {
    console.error(error.message);
  } finally {
    await mongoose.disconnect();
  }
}

main();
