import express from 'express';
import path from 'path';
import compression from "compression";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
import userRoutes from './routes/userRoutes.js';
import adminRoutes from "./routes/adminRoutes.js";
import env from 'dotenv'
env.config();
import db from "./config/db.js";
import session from "express-session";
import nocache from "nocache"
import passport from "./config/passport.js";
db()

// Parse
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//Session
app.use(nocache())
app.use(session({
  secret: process.env.SESSION_KEY,
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge:parseInt(process.env.SESSION_MAX_AGE,10)
  }
}))

//Handle Error
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render("notfound", { message: err.message });
});

// Compresor
app.use(compression());


app.use(passport.initialize())
app.use(passport.session())

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set("views", [path.join(__dirname, "views/user"),path.join(__dirname, "views/admin")]);

app.get("/admin",(req,res)=>res.redirect("/admin/login"))

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));



// Routes
app.use('/', userRoutes)
app.use('/admin', adminRoutes);

app.use((req, res, next) => {
  res.locals.currentUrl = req.path;
  next();
});

// Start the server
app.listen(process.env.PORT, () => {
  console.log(`Server running at http://localhost:${process.env.PORT}`);
});