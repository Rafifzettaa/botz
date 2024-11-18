const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");

const generateRoute = require("./routes/generate"); // Import route generate

const app = express();

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public"))); // Untuk file statis
app.set("view engine", "ejs"); // Menggunakan EJS sebagai template engine
app.set("views", path.join(__dirname, "views")); // Direktori views

// Gunakan route /generate yang telah didefinisikan di generateRoute
app.use(generateRoute);

// Rute utama untuk halaman form
app.get("/", (req, res) => {
  res.render("index"); // Render file `views/index.ejs`
});

// Jalankan server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
