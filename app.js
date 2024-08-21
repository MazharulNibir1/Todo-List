
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

//database connection
mongoose.connect("mongodb+srv://Admin-Nibir:test123@cluster0.gwy4f.mongodb.net/todolistDB");

//database schema
const itemsSchema = mongoose.Schema({
  name: String,
});

//database model
const Item = mongoose.model('Item', itemsSchema);

//creating documents
const item1 = new Item({
  name: "Welcome to your todolist"
});

const item2 = new Item({
  name: "Hit the + button to add a new item"
});

const item3 = new Item({
  name: "<-- Hit this to delete an item"
});

//array
const defaultItems = [item1, item2, item3];

//list schema
const listSchema = {
  name: String,
  items: [itemsSchema],
};

//list model
const List = mongoose.model("List", listSchema);


app.get("/", function(req, res) {

  Item.find({})
  .then(function(foundItems) {
    if(foundItems.length === 0){
      //using insert many to insert item1, item2, item3
      Item.insertMany(defaultItems)
        .then(function() {
        console.log("Success -- Saved default items to DB");
      })
        .catch(function(err) {
          console.log(err);
      });
      res.redirect("/"); //because the data has saved but not rendering we use redirect which will in turn
                          //take it to else directly and execute render.
    } else {
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
    
  }, function(err) {
    console.log(err);
  });

});

app.get("/:customListName", function(req, res){
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName })
  .then(function(foundList) {
    if (!foundList) {
      //create a new list
      const list = new List({
        name: customListName,
        items: defaultItems
      });
      list.save();
      res.redirect("/" + customListName);
    } else {
      // show an existing list
      res.render("list", {listTitle: foundList.name, newListItems: foundList.items})
    }
  })
  .catch(function(err) {
    console.log("An error occurred:", err);
  });



});

app.post("/", function(req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName === "Today") {
    item.save()
      .then(() => {
        res.redirect("/");
      })
      .catch(err => {
        console.log("An error occurred:", err);
        res.status(500).send("An error occurred");
      });
  } else {
    List.findOne({ name: listName })
      .then(function(foundList) {
        if (foundList) {
          foundList.items.push(item);
          return foundList.save();
        } else {
          throw new Error("List not found");
        }
      })
      .then(function() {
        res.redirect("/" + listName);
      })
      .catch(function(err) {
        console.log("An error occurred:", err);
        res.status(500).send("An error occurred");
      });
  }
});


app.get("/work", function(req,res){
  res.render("list", {listTitle: "Work List", newListItems: workItems});
});

app.get("/about", function(req, res){
  res.render("about");
});

app.post("/delete", function(req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today"){
    Item.findByIdAndDelete(checkedItemId)
    .then(function() {
      console.log("Item deleted successfully");
      res.redirect("/");
    })
    .catch(function(err) {
      console.log(err);
    });
  } else {
    List.findOneAndUpdate({ name: listName },{ $pull: { items: { _id: checkedItemId } } })
    .then(function(foundList) {
      res.redirect("/" + listName);
    })
    .catch(function(err) {
      console.log("An error occurred:", err);
      res.status(500).send("An error occurred");
    });
    
  }

  
});


app.listen(3000, function() {
  console.log("Server started on port 3000");
});
