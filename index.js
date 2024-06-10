// Importing required modules
const express = require("express");
const path = require("path");
const axios = require("axios"); 
const dotenv = require("dotenv");
const { MongoClient, ObjectId } = require('mongodb');
const session = require("express-session");

dotenv.config();

const dbUrl = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PWD}@${process.env.DB_HOST}/`;

const client = new MongoClient(dbUrl);

// Set up express object and port
const app = express();
const port = process.env.PORT || "8888";

// Set up views folder and templating engine
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

// Middleware to parse request bodies
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));

// Set up path for static files
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "script")));

// MongoDB functions
async function connection(){
    const db = client.db("fashionforecast");
    return db;
}

// Get styledata collections
async function getStyles(){
    const db = await connection();
    const results = db.collection("styledata").find({});
    return await results.toArray();
}

// Get a single styledata by it's ID
async function getSingleStyle(id) {
    const db = await connection();
    return await db.collection("styledata").findOne({ _id: ObjectId.createFromHexString(id) });
}

// CRUD functions
// Retrieve the style list from the database
app.get("/admin", async (req, res) => {
    try {
        const styles = await getStyles();
        res.render("admin", { title: "Style List", styles });
    } catch (error) {
        res.status(500).send("Error fetching styles");
    }
});

// Add a new style
app.post("/admin/style/add/submit", async (req, res) => {
    const stylename = req.body.stylename;
    const newStyle = { "stylename": stylename };
    await addStyle(newStyle);
    res.redirect("/admin"); // Redirect back to admin page
});

async function addStyle(styleData){
    const db = await connection();
    await db.collection("styledata").insertOne(styleData);
    console.log("New style item added:", styleData);
}

// Retrieve the edit page with the selected style id
app.get("/admin/style/edit", async (req, res) => {
    try {
        const styleId = req.query.styleid;
        if (!styleId) {
            return res.redirect("/admin");
        }
        const style = await getSingleStyle(styleId);
        if (!style) {
            return res.redirect("/admin");
        }
        const styles = await getStyles();
        res.render("admin-edit", { title: "Edit a style", stylelist: styles, editStyle: style });
    } catch (error) {
        console.error("Error fetching style for edit:", error);
        res.status(500).send("Error fetching style for edit");
    }
});

// Submit the edited style
app.post("/admin/style/edit/submit", async (req, res) => {
    const styleId = req.body.styleId;
    const idFilter = { _id: ObjectId.createFromHexString(styleId) };

    const style = {
        stylename: req.body.stylename
    };
    await editStyle(idFilter, style);
    res.redirect("/admin");
});

async function editStyle(filter, style){
    const db = await connection();
    const updateSet = { $set: style };
    await db.collection("styledata").updateOne(filter, updateSet);
    console.log("Style edited");
}

//Delete a style by its style id
app.post("/admin/style/delete", async (request, response) => {
    const styleId = request.body.styleId;
    const idFilter = { _id: ObjectId.createFromHexString(styleId) };

    try {
        await deleteStyle(idFilter);
        response.redirect("/admin");
    } catch (error) {
        console.error("Error deleting style:", error);
        response.status(500).send("Error deleting style");
    }
});

async function deleteStyle(filter) {
    db = await connection();
    await db.collection("styledata").deleteOne(filter);
    console.log("style deleted:", filter);
}

//CRUD functions ends here

// Function to retrieve the login page
app.get("/login", async (req, res) => {
    res.render("login", {
        title: "Login"
    });  
});

// Function to retrieve the home page
app.get("/", async (req, res) => {
    res.render("index", {
        title: "Home"
    });  
});

// Function to retrieve the about page
app.get("/about", async (req, res) => {
    res.render("about", {
        title: "About"
    });  
});

// Function to retrieve the style form page for the user to select their preferences
app.get("/styleform", async (req, res) => {

    try {
        const styles = await getStyles();
        res.render("styleform", { title: "Style Form", styles });
    } catch (error) {
        res.status(500).send("Error fetching styles");
    }

});


// Function to retrieve the explore page
// app.get("/explore", async (req, res) => {
//     try {
//         const city = req.query.city || "toronto";
//         const gender = req.query.gender || "Woman";

//         const weatherRes = await axios.get("https://api.openweathermap.org/data/2.5/weather", {
//             params: {
//                 q: city,
//                 appId: process.env.WEATHER_API,
//                 units: "metric"
//             }
//         });

//         if (!weatherRes.data.name) {
//             res.render("error", { message: "City not found" });
//             return;
//         }

//         const weatherDesc = weatherRes.data.weather[0].description;
//         const icon = weatherRes.data.weather[0].icon;
//         const keywords = getKeywords(weatherDesc, gender);

//         const pexelsRes = await axios.get("https://api.pexels.com/v1/search", {
//             headers: {
//                 Authorization: process.env.PEXELS_API
//             },
//             params: {
//                 query: keywords.join(", "),
//                 per_page: 10
//             }
//         });

//         res.render("explore", {
//             title: "Explore",
//             weather: weatherRes.data,
//             pexelsData: pexelsRes.data
//         });
//     } catch (error) {
//         if (error.response) {
//             console.error("Error: ", error.response.data);
//         } else {
//             console.error("Error: ", error.message);
//         }
        
//         res.status(500).render("error", { message: "Internal Server Error" });
//     }
// });

// function getKeywords(weatherDesc, gender) {
//     const weatherKeywords = {
//         "clear sky": ["tshirt", "shorts", "casual"],
//         "few clouds": ["cloudy", "casual"],
//         "scattered clouds": ["casual", "shirt", "pants"],
//         "broken clouds": ["layered", "stylish"],
//         "moderate rain": ["sweater", "raincoat"],
//         "light rain": ["waterproof", "sweater"],
//         "shower rain": ["waterproof", "rainy"],
//         "rain": ["turtleneck", "coat", "umbrella"],
//         "thunderstorm": ["pullover", "jacket"],
//         "snow": ["beanie", "coat", "sweater"],
//         "mist": ["turtleneck", "coat"],
//         "smoke": ["turtleneck", "jacket"],
//         "haze": ["sweater", "beanie"],
//         "dust": ["coat", "jacket"],
//         "fog": ["sweater", "coat"],
//         "sand": ["shirt", "shorts"],
//         "ash": ["warm shirt", "stylish"],
//         "squall": ["cardigan", "shirt"],
//         "tornado": ["wind", "jacket"],
//         "overcast clouds": ["casual", "fashion"]
//     };

//     if (weatherKeywords[weatherDesc]) {
//         return gender ? [gender, ...weatherKeywords[weatherDesc]] : weatherKeywords[weatherDesc];
//     } else {
//         const generalKeywords = ["outfit", 'fashion'];
//         return gender ? [gender, weatherDesc, ...generalKeywords] : [weatherDesc, ...generalKeywords];
//     }
// }


// testing explore code based on the keywords selected
app.get("/explore", async (req, res) => {
    try {
        const city = req.query.city || "toronto";
        const gender = req.query.gender || "Woman";
        const styles = req.query.styles || [];

        const weatherRes = await axios.get("https://api.openweathermap.org/data/2.5/weather", {
            params: {
                q: city,
                appId: process.env.WEATHER_API,
                units: "metric"
            }
        });

        if (!weatherRes.data.name) {
            res.render("error", { message: "City not found" });
            return;
        }

        const weatherDesc = weatherRes.data.weather[0].description;
        const icon = weatherRes.data.weather[0].icon;

        // Get images based on styles and gender
        const styleKeywords = getKeywords(gender, styles);

        const pexelsStyleRes = await axios.get("https://api.pexels.com/v1/search", {
            headers: {
                Authorization: process.env.PEXELS_API
            },
            params: {
                query: styleKeywords.join(", "),
                per_page: 5
            }
        });

        // Get images based on weather description and gender (accessories)
        const accessoryKeywords = getAccessories(weatherDesc, gender);

        const pexelsAccessoryRes = await axios.get("https://api.pexels.com/v1/search", {
            headers: {
                Authorization: process.env.PEXELS_API
            },
            params: {
                query: accessoryKeywords.join(", "),
                per_page: 5
            }
        });

        res.render("explore", {
            title: "Explore",
            weather: weatherRes.data,
            pexelsStyleData: pexelsStyleRes.data,
            pexelsAccessoryData: pexelsAccessoryRes.data
        });
    } catch (error) {
        if (error.response) {
            console.error("Error: ", error.response.data);
        } else {
            console.error("Error: ", error.message);
        }
        
        res.status(500).render("error", { message: "Internal Server Error" });
    }
});

function getAccessories(weatherDesc, gender) {
    const weatherKeywords = {
        "clear sky": ["sunglasses", "hat"],
        "few clouds": ["light jacket", "cap"],
        "scattered clouds": ["light jacket", "cap"],
        "broken clouds": ["jacket", "cap"],
        "moderate rain": ["umbrella", "raincoat"],
        "light rain": ["umbrella", "raincoat"],
        "shower rain": ["umbrella", "raincoat"],
        "rain": ["umbrella", "raincoat"],
        "thunderstorm": ["umbrella", "raincoat"],
        "snow": ["gloves", "scarf", "boots"],
        "mist": ["scarf", "hat"],
        "smoke": ["mask", "beanie"],
        "haze": ["mask", "beanie"],
        "dust": ["mask", "hat"],
        "fog": ["scarf", "hat"],
        "sand": ["mask", "hat"],
        "ash": ["mask", "hat"],
        "squall": ["windbreaker", "hat"],
        "tornado": ["windbreaker", "hat"],
        "overcast clouds": ["jacket", "scarf"]
    };

    let keywords = [];

    if (weatherKeywords[weatherDesc]) {
        keywords = gender ? [gender, ...weatherKeywords[weatherDesc]] : weatherKeywords[weatherDesc];
    } else {
        const generalKeywords = ["accessory", "clothing"];
        keywords = gender ? [gender, weatherDesc, ...generalKeywords] : [weatherDesc, ...generalKeywords];
    }

    return keywords;
}

function getKeywords(gender, styles = []) {
    return styles.map(style => `${gender} ${style}`);
}



// Set up server listening
app.listen(port, () => { 
    console.log(`Listening on http://localhost:${port}`);
});
