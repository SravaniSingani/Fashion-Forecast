//importing required modules
const express = require("express");
const path = require("path");
const axios = require("axios"); 
const dotenv = require("dotenv");

dotenv.config();

//set up express object and port
const app = express();
const port = process.env.PORT || "8888";

//where your views folder is located and which templatingengine is being used
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

//set up path for static files
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "script")));



//test msg
/*
error.pug
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('error', { error: err });
});

app.get("/",(req, res) => {
//    res.status(200).send("Test Page");
res.render("index", {title: "Home"});
});

*/
// to get weather and images

// pexels api key : "ODdcE7sM6zymPeJX1wrLUC8DvoIR4J0bDy2Jm34enE3QIAOC8SB6h2iC";

app.get("/about", async(req, res) => {

   // res.render("about", { title: About});
    res.render("about", {
        title: "About"
    });  
});

app.get("/", async(req, res) => {

     res.render("index", {
         title: "Home"
     });  
 });

app.get("/explore", async(req, res) => {
    try{
        //Access the open weather map data
        const city = req.query.city || "toronto";
       // console.log(city);
        const gender = req.query.gender;
       // console.log(gender);

        const weatherRes = await axios.get("https://api.openweathermap.org/data/2.5/weather", {
            params: {
                q: city,
                appId: process.env.WEATHER_API,
                units: "metric"
            }
        });

        if(!weatherRes.data.name){
            res.render("error", {message: "City not found" });
            return;
        }

       //Access the pexels data
       const weatherDesc = weatherRes.data.weather[0].description;
       const icon = weatherRes.data.weather[0].icon;
       const keywords = getKeywords(weatherDesc, gender);

        const pexelsRes = await axios.get("https://api.pexels.com/v1/search", {
            headers: {
                Authorization: process.env.PEXELS_API
            },
            params: {
                query: keywords.join(", "),
                per_page: 10
            }
        });
       // console.log("weather data: ", weatherRes.data);
      //  console.log("Pexels Data: ", pexelsRes.data);

        res.render("explore", {
            title: "Explore",
            weather: weatherRes.data,
            pexelsData: pexelsRes.data

        });


    } catch (error){
        if(error.response){
            console.error("Error: ", error.response.data);
        }
        else{
            console.error("Error: ", error.message);
        }
        
        res.status(500).render("error", {message: "Internal Server Error"});
    }
});

function getKeywords(weatherDesc, gender) {
    const weatherKeywords = {
        "clear sky": [ "tshirt", "shorts", "casual"],
        "few clouds": ["cloudy", "casual"],
        "scattered clouds": ["casual", "shirt", "pants"],
        "broken clouds": ["layered", "stylish"],
        "moderate rain": ["sweater","raincoat"],
        "light rain": ["waterproof", "sweater"],
        "shower rain": ["waterproof", "rainy"],
        "rain": ["turtleneck", "coat", "umbrella"],
        "thunderstorm": ["pullover", "jacket"],
        "snow": ["beanie", "coat", "sweater"],
        "mist": ["turtleneck", "coat"],
        "smoke": ["turtleneck", "jacket"],
        "haze": ["sweater", "beanie"],
        "dust": ["coat", "jacket"],
        "fog": ["sweater", "coat"],
        "sand": ["shirt", "shorts"],
        "ash": ["warm shirt", "stylish"],
        "squall": ["cardigan", "shirt"],
        "tornado": ["wind", "jacket"],
        "overcast clouds": ["casual", "fashion"]

    };
    // const keywords = gender ? [gender] : [];
    // Requesting the pictures based on the keywords
    if(weatherKeywords[weatherDesc]){
        return gender ? [gender, ...weatherKeywords[weatherDesc]] : weatherKeywords[weatherDesc];
    }

    // Providing the weatherDesc as a keyword by default if not listed
    else{
        const generalKeywords = ["outfit", 'fasion'];
        return gender ? [gender, weatherDesc, ...generalKeywords] :[weatherDesc, ...generalKeywords];

    }
    

}


//set up server listening
app.listen(port, () => { 
    console.log(`Listening on http://localhost:${port}`);
});