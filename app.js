//jshint esversion:6

// include the required npm packages
const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash");
const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

//connect to mongodb server
mongoose.connect("mongodb://localhost:27017/todolistDB", {useNewUrlParser:true});

//Mongoose Schema
/*
const <schemaName> = {
  <fieldName> : <FieldDataType>,...
}
*/
const itemsSchema = {
  name: String
};

//Mongoose Model
/*
const = mongoose.model(
  <"SingularCollectionName">,
  <schemaName>
);
*/
const Item = mongoose.model("Item", itemsSchema);

//Mongoose Document
/*
  const <constantName> = new <ModelName>(
  {
  <fieldName>: <fieldData>,...
}
);
*/


const item1 = new Item({
  name: "Welcome to your todolist!"
});

const item2 = new Item({
  name: "Hit the + button to add a new item."
});

const item3 = new Item({
  name: "<-- Hit this to delete an item."
});
// Mongoose insertMany()
/*
function(err): callback function.....
<ModelName>.insertMany(<documentArray>, function(err){
  //Deal with error or log success.
});
*/
const defaultItems = [item1, item2, item3];

const listSchema = {
  name:String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

//old version:
//const items = ["Buy Food", "Cook Food", "Eat Food"];
//const workItems = [];


// Get request to the server: return date if user try to access home route /
// Render daytime, title and actual list items
app.get("/", function(req, res) {

//old version:
//const day = date.getDate();


  //Mongoose find()
  /*
  <ModeName>.find({conditions}, function(err, results){
  //Use the found results docs.
  });
  */

  Item.find({}, function(err,foundItems){

    //when item collection has no item, then simply insert 3 new default items
    if(foundItems.length === 0){
      Item.insertMany(defaultItems, function(err){
        if(err){
          console.log(err);
        } else {
          console.log("Successfully saved default items to DB.");
        }
      });

      // run app.get("/",(req,res)) again...(home route /)
      //check if there are any item collection , if not then create 3 defaults item, else render found items
      res.redirect("/");
    } else {
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  });
});

app.get("/:customListName", function(req,res){
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName}, function(err, foundList){
    if(!err){
      if(!foundList){
        //Create a new List
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + customListName);

      } else {
        //Show an existing list
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items})
      }
    }
  });
});

// Post request from the user: get input data from the user through input-form
// Afterthat, If the route is /: show standard list item
// If the route is /work: show work list item
app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if(listName === "Today"){
    //save input item to the database collection
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, function(err,foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/"+ listName);
    });
  }

  //old version:
  // if (req.body.list === "Work") {
  //   workItems.push(item);
  //   res.redirect("/work");
  // } else {
  //   items.push(item);
  //   res.redirect("/");
  // }
});


app.post("/delete",function(req,res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today"){
    //Mongoose findByIdAndRemove()
    /*
    <ModelName>.findIdAndRemove(<Id>, function(err){
      //Handle any errors or log success.
    });
    */
    Item.findByIdAndRemove(checkedItemId,function(err){
      if(!err){
        console.log("Successfully deleted checked item.")
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({name: listName}, {$pull:{items:{_id: checkedItemId}}}, function(err,foundList){
      if(!err){
        res.redirect("/"+ listName);
      }
    } );
  }

  //Mongoose findOneAndUpdate()
  /*
    <ModelName>.findOneAndUpdate(
    //what to find
    {conditions},

    //what to be updated
    {$pull: {field: {_id: value}}},

    //callback
    function(err, results){}
  );
  */



});

//old version:
// Get request to the server to show the actual worklist item if user try to access route /work
// Render title "Work List", actual worklist item
// app.get("/work", function(req,res){
//   res.render("list", {listTitle: "Work List", newListItems: workItems});
// });


//get request to the server to show the about page if user try to access route /about
app.get("/about", function(req, res){
  res.render("about");
});


//create server at localhost:3000
app.listen(3000, function() {
  console.log("Server started on port 3000");
});
